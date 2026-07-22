import { Test, TestingModule } from '@nestjs/testing';
import { LoadTestingService } from './load-testing.service';
import { PrismaService } from '../common/prisma.service';
import { EventsService } from '../events/events.service';
import { MetricsService } from '../metrics/metrics.service';
import { AppLogger } from '../common/logger.service';
import { FailureService } from '../failure/failure.service';
import { BadRequestException } from '@nestjs/common';

describe('LoadTestingService', () => {
  let service: LoadTestingService;

  const metricsMock = {
    activeLoadJobs: { inc: jest.fn(), dec: jest.fn() },
    cpuLoadJobsTotal: { inc: jest.fn() },
    databaseLoadJobsTotal: { inc: jest.fn() },
    httpLoadJobsTotal: { inc: jest.fn() },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoadTestingService,
        { provide: PrismaService, useValue: {} },
        {
          provide: EventsService,
          useValue: { create: jest.fn().mockResolvedValue({}) },
        },
        { provide: MetricsService, useValue: metricsMock },
        { provide: AppLogger, useValue: { info: jest.fn() } },
        {
          provide: FailureService,
          useValue: { assertDatabaseAvailable: jest.fn() },
        },
      ],
    }).compile();

    service = module.get(LoadTestingService);
  });

  it('starts a CPU load job and returns jobId', async () => {
    const result = await service.startCpuLoad({
      durationSeconds: 1,
      workers: 1,
    });
    expect(result.jobId).toBeDefined();
    expect(result.type).toBe('cpu');
    expect(result.status).toBe('started');

    const job = service.getJob(result.jobId);
    expect(job.type).toBe('cpu');
  });

  it('lists jobs', async () => {
    await service.startCpuLoad({ durationSeconds: 1, workers: 1 });
    const jobs = service.listJobs();
    expect(jobs.length).toBeGreaterThanOrEqual(1);
  });

  it('rejects when too many active jobs', async () => {
    // Mark synthetic active jobs without starting long CPU burns
    for (let i = 0; i < 5; i++) {
      const id = `job-${i}`;
      (service as unknown as { jobs: Map<string, unknown> }).jobs.set(id, {
        jobId: id,
        type: 'cpu',
        status: 'running',
        startedAt: new Date().toISOString(),
      });
    }
    await expect(
      service.startCpuLoad({ durationSeconds: 1, workers: 1 }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
