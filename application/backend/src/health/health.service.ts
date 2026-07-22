import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import * as os from 'os';
import { FailureService } from '../failure/failure.service';
import { EventsService } from '../events/events.service';

@Injectable()
export class HealthService {
  private readonly startedAt = Date.now();

  constructor(
    private readonly prisma: PrismaService,
    private readonly failureService: FailureService,
    private readonly eventsService: EventsService,
  ) {}

  async check() {
    const database = await this.checkDatabase();
    const status = database.status === 'connected' ? 'ok' : 'degraded';

    if (database.status !== 'connected') {
      await this.eventsService.create({
        type: 'HEALTH_CHECK_FAILURE',
        message: 'Health check reported database unavailable',
        metadata: database,
      });
    }

    return {
      status,
      timestamp: new Date().toISOString(),
      hostname: os.hostname(),
      version: process.env.APP_VERSION || '1.0.0',
      uptime: Math.floor((Date.now() - this.startedAt) / 1000),
      database,
    };
  }

  live() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  async ready() {
    if (this.failureService.isDatabaseUnavailable()) {
      throw new ServiceUnavailableException({
        status: 'not_ready',
        reason: 'database_unavailable_simulation',
      });
    }

    const database = await this.checkDatabase();
    if (database.status !== 'connected') {
      throw new ServiceUnavailableException({
        status: 'not_ready',
        reason: 'database_unavailable',
        database,
      });
    }

    return {
      status: 'ready',
      timestamp: new Date().toISOString(),
      database,
    };
  }

  private async checkDatabase(): Promise<{
    status: 'connected' | 'disconnected';
    latencyMs: number | null;
    error?: string;
  }> {
    if (this.failureService.isDatabaseUnavailable()) {
      return {
        status: 'disconnected',
        latencyMs: null,
        error: 'Simulated database unavailable',
      };
    }

    const start = Date.now();
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        status: 'connected',
        latencyMs: Date.now() - start,
      };
    } catch (error) {
      return {
        status: 'disconnected',
        latencyMs: null,
        error: error instanceof Error ? error.message : 'Unknown database error',
      };
    }
  }
}
