import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import * as os from 'os';
import { PrismaService } from '../common/prisma.service';
import { EventsService } from '../events/events.service';
import { MetricsService } from '../metrics/metrics.service';
import { AppLogger } from '../common/logger.service';
import { FailureService } from '../failure/failure.service';
import { CpuLoadDto, DatabaseLoadDto, HttpLoadDto } from './dto/load.dto';

export type LoadJobType = 'cpu' | 'database' | 'http';
export type LoadJobStatus = 'started' | 'running' | 'completed' | 'failed';

export interface LoadJob {
  jobId: string;
  type: LoadJobType;
  status: LoadJobStatus;
  durationSeconds?: number;
  workers?: number;
  operations?: number;
  concurrency?: number;
  requests?: number;
  endpoint?: string;
  startedAt: string;
  endedAt?: string;
  error?: string;
  result?: Record<string, unknown>;
}

@Injectable()
export class LoadTestingService {
  private readonly jobs = new Map<string, LoadJob>();
  private readonly maxActiveJobs = 5;

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventsService: EventsService,
    private readonly metrics: MetricsService,
    private readonly logger: AppLogger,
    private readonly failureService: FailureService,
  ) {}

  listJobs() {
    return Array.from(this.jobs.values()).sort(
      (a, b) =>
        new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime(),
    );
  }

  getJob(id: string) {
    const job = this.jobs.get(id);
    if (!job) {
      throw new NotFoundException(`Load job ${id} not found`);
    }
    return job;
  }

  private activeCount() {
    return Array.from(this.jobs.values()).filter(
      (j) => j.status === 'started' || j.status === 'running',
    ).length;
  }

  private assertCanStart() {
    if (this.activeCount() >= this.maxActiveJobs) {
      throw new BadRequestException(
        `Too many active load jobs (max ${this.maxActiveJobs})`,
      );
    }
  }

  async startCpuLoad(dto: CpuLoadDto) {
    this.assertCanStart();
    const jobId = uuidv4();
    const job: LoadJob = {
      jobId,
      type: 'cpu',
      status: 'started',
      durationSeconds: dto.durationSeconds,
      workers: dto.workers,
      startedAt: new Date().toISOString(),
    };
    this.jobs.set(jobId, job);
    this.metrics.activeLoadJobs.inc({ type: 'cpu' });
    this.metrics.cpuLoadJobsTotal.inc({ status: 'started' });

    await this.eventsService.create({
      type: 'CPU_LOAD_STARTED',
      message: `CPU load started for ${dto.durationSeconds}s with ${dto.workers} worker(s)`,
      metadata: { jobId, ...dto },
    });

    this.logger.info(
      'CPU load job started',
      { jobId, durationSeconds: dto.durationSeconds, workers: dto.workers },
      'LoadTestingService',
    );

    void this.runCpuLoad(job, dto);
    return {
      jobId,
      type: 'cpu',
      status: 'started',
      durationSeconds: dto.durationSeconds,
    };
  }

  private async runCpuLoad(job: LoadJob, dto: CpuLoadDto) {
    job.status = 'running';
    const endAt = Date.now() + dto.durationSeconds * 1000;

    try {
      const workers: Promise<void>[] = [];
      for (let i = 0; i < dto.workers; i++) {
        workers.push(
          new Promise((resolve, reject) => {
            // Inline CPU burn without worker_threads file for portability
            const burn = () => {
              while (Date.now() < endAt) {
                let x = 0;
                for (let j = 0; j < 100000; j++) {
                  x += Math.sqrt(j) * Math.sin(j);
                }
                if (x === Infinity) break;
              }
              resolve();
            };
            // Yield to event loop between chunks using setImmediate pattern
            const chunk = () => {
              const chunkEnd = Math.min(Date.now() + 50, endAt);
              let x = 0;
              while (Date.now() < chunkEnd) {
                for (let j = 0; j < 5000; j++) {
                  x += Math.sqrt(j) * Math.sin(j);
                }
              }
              if (Date.now() < endAt) {
                setImmediate(chunk);
              } else {
                void x;
                resolve();
              }
            };
            try {
              if (dto.workers === 1) {
                chunk();
              } else {
                // Parallel-ish via Promise.all of chunked burns
                burn();
              }
            } catch (err) {
              reject(err);
            }
          }),
        );
      }

      await Promise.all(workers);
      job.status = 'completed';
      job.endedAt = new Date().toISOString();
      job.result = { hostname: os.hostname(), workers: dto.workers };
      this.metrics.cpuLoadJobsTotal.inc({ status: 'completed' });

      await this.eventsService.create({
        type: 'CPU_LOAD_COMPLETED',
        message: `CPU load completed (${dto.durationSeconds}s)`,
        metadata: { jobId: job.jobId },
      });
    } catch (error) {
      job.status = 'failed';
      job.endedAt = new Date().toISOString();
      job.error = error instanceof Error ? error.message : 'CPU load failed';
      this.metrics.cpuLoadJobsTotal.inc({ status: 'failed' });
      await this.eventsService.create({
        type: 'CPU_LOAD_FAILED',
        message: job.error,
        metadata: { jobId: job.jobId },
      });
    } finally {
      this.metrics.activeLoadJobs.dec({ type: 'cpu' });
    }
  }

  async startDatabaseLoad(dto: DatabaseLoadDto) {
    this.assertCanStart();
    this.failureService.assertDatabaseAvailable();

    const jobId = uuidv4();
    const job: LoadJob = {
      jobId,
      type: 'database',
      status: 'started',
      operations: dto.operations,
      concurrency: dto.concurrency,
      startedAt: new Date().toISOString(),
    };
    this.jobs.set(jobId, job);
    this.metrics.activeLoadJobs.inc({ type: 'database' });
    this.metrics.databaseLoadJobsTotal.inc({ status: 'started' });

    await this.eventsService.create({
      type: 'DATABASE_LOAD_STARTED',
      message: `Database load started (${dto.operations} ops, concurrency ${dto.concurrency})`,
      metadata: { jobId, ...dto },
    });

    this.logger.info(
      'Database load job started',
      { jobId, operations: dto.operations, concurrency: dto.concurrency },
      'LoadTestingService',
    );

    void this.runDatabaseLoad(job, dto);
    return {
      jobId,
      type: 'database',
      status: 'started',
      operations: dto.operations,
      concurrency: dto.concurrency,
    };
  }

  private async runDatabaseLoad(job: LoadJob, dto: DatabaseLoadDto) {
    job.status = 'running';
    let completed = 0;
    let failed = 0;

    try {
      const queue = Array.from({ length: dto.operations }, (_, i) => i);
      const workers = Array.from({ length: dto.concurrency }, async () => {
        while (queue.length > 0) {
          const opIndex = queue.shift();
          if (opIndex === undefined) break;
          try {
            await this.runDbOperation(opIndex);
            completed += 1;
          } catch {
            failed += 1;
          }
        }
      });

      await Promise.all(workers);

      // Cleanup temporary load records
      await this.prisma.record.deleteMany({
        where: { title: { startsWith: '__load__' } },
      });

      job.status = 'completed';
      job.endedAt = new Date().toISOString();
      job.result = { completed, failed, operations: dto.operations };
      this.metrics.databaseLoadJobsTotal.inc({ status: 'completed' });

      await this.eventsService.create({
        type: 'DATABASE_LOAD_COMPLETED',
        message: `Database load completed (${completed}/${dto.operations})`,
        metadata: { jobId: job.jobId, completed, failed },
      });
    } catch (error) {
      job.status = 'failed';
      job.endedAt = new Date().toISOString();
      job.error =
        error instanceof Error ? error.message : 'Database load failed';
      this.metrics.databaseLoadJobsTotal.inc({ status: 'failed' });
      await this.eventsService.create({
        type: 'DATABASE_LOAD_FAILED',
        message: job.error,
        metadata: { jobId: job.jobId },
      });
    } finally {
      this.metrics.activeLoadJobs.dec({ type: 'database' });
    }
  }

  private async runDbOperation(index: number) {
    const kind = index % 4;
    if (kind === 0) {
      await this.prisma.record.create({
        data: {
          title: `__load__${uuidv4()}`,
          description: 'Temporary load-test record',
          status: 'active',
        },
      });
      return;
    }
    if (kind === 1) {
      await this.prisma.record.findMany({ take: 10, orderBy: { createdAt: 'desc' } });
      return;
    }
    if (kind === 2) {
      const existing = await this.prisma.record.findFirst({
        where: { title: { startsWith: '__load__' } },
      });
      if (existing) {
        await this.prisma.record.update({
          where: { id: existing.id },
          data: { description: `updated-${Date.now()}` },
        });
      }
      return;
    }
    await this.prisma.record.groupBy({
      by: ['status'],
      _count: { _all: true },
    });
  }

  async startHttpLoad(dto: HttpLoadDto) {
    this.assertCanStart();
    const jobId = uuidv4();
    const job: LoadJob = {
      jobId,
      type: 'http',
      status: 'started',
      requests: dto.requests,
      concurrency: dto.concurrency,
      endpoint: dto.endpoint,
      startedAt: new Date().toISOString(),
    };
    this.jobs.set(jobId, job);
    this.metrics.activeLoadJobs.inc({ type: 'http' });
    this.metrics.httpLoadJobsTotal.inc({ status: 'started' });

    await this.eventsService.create({
      type: 'HTTP_LOAD_STARTED',
      message: `HTTP load started (${dto.requests} requests to ${dto.endpoint})`,
      metadata: { jobId, ...dto },
    });

    void this.runHttpLoad(job, dto);
    return {
      jobId,
      type: 'http',
      status: 'started',
      requests: dto.requests,
      concurrency: dto.concurrency,
      endpoint: dto.endpoint,
    };
  }

  private async runHttpLoad(job: LoadJob, dto: HttpLoadDto) {
    job.status = 'running';
    const port = process.env.PORT || '3000';
    const baseUrl = `http://127.0.0.1:${port}`;
    let success = 0;
    let failed = 0;
    const latencies: number[] = [];

    try {
      const queue = Array.from({ length: dto.requests }, (_, i) => i);
      const workers = Array.from({ length: dto.concurrency }, async () => {
        while (queue.length > 0) {
          const next = queue.shift();
          if (next === undefined) break;
          const start = Date.now();
          try {
            const res = await fetch(`${baseUrl}${dto.endpoint}`, {
              headers: { 'x-load-job-id': job.jobId },
            });
            latencies.push(Date.now() - start);
            if (res.ok) success += 1;
            else failed += 1;
          } catch {
            failed += 1;
            latencies.push(Date.now() - start);
          }
        }
      });

      await Promise.all(workers);

      const avgLatency =
        latencies.length > 0
          ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length)
          : 0;

      job.status = 'completed';
      job.endedAt = new Date().toISOString();
      job.result = {
        success,
        failed,
        avgLatencyMs: avgLatency,
        endpoint: dto.endpoint,
      };
      this.metrics.httpLoadJobsTotal.inc({ status: 'completed' });

      await this.eventsService.create({
        type: 'HTTP_LOAD_COMPLETED',
        message: `HTTP load completed (${success} ok / ${failed} failed)`,
        metadata: { jobId: job.jobId, success, failed, avgLatency },
      });
    } catch (error) {
      job.status = 'failed';
      job.endedAt = new Date().toISOString();
      job.error = error instanceof Error ? error.message : 'HTTP load failed';
      this.metrics.httpLoadJobsTotal.inc({ status: 'failed' });
    } finally {
      this.metrics.activeLoadJobs.dec({ type: 'http' });
    }
  }
}
