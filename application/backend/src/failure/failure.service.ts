import {
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { EventsService } from '../events/events.service';
import { AppLogger } from '../common/logger.service';

interface ErrorRateState {
  percentage: number;
  expiresAt: number;
}

interface SlowState {
  delayMs: number;
}

interface DbUnavailableState {
  enabled: boolean;
  expiresAt: number | null;
}

@Injectable()
export class FailureService {
  private errorRate: ErrorRateState | null = null;
  private slow: SlowState = { delayMs: 0 };
  private dbUnavailable: DbUnavailableState = {
    enabled: false,
    expiresAt: null,
  };

  constructor(
    private readonly eventsService: EventsService,
    private readonly logger: AppLogger,
  ) {}

  getStatus() {
    this.cleanupExpired();
    return {
      slow: {
        active: this.slow.delayMs > 0,
        delayMs: this.slow.delayMs,
      },
      errorRate: this.errorRate
        ? {
            active: true,
            percentage: this.errorRate.percentage,
            expiresAt: new Date(this.errorRate.expiresAt).toISOString(),
            remainingSeconds: Math.max(
              0,
              Math.ceil((this.errorRate.expiresAt - Date.now()) / 1000),
            ),
          }
        : { active: false, percentage: 0, expiresAt: null, remainingSeconds: 0 },
      databaseUnavailable: {
        active: this.isDatabaseUnavailable(),
        expiresAt: this.dbUnavailable.expiresAt
          ? new Date(this.dbUnavailable.expiresAt).toISOString()
          : null,
      },
      anyActive:
        this.slow.delayMs > 0 ||
        !!this.errorRate ||
        this.isDatabaseUnavailable(),
    };
  }

  async setSlow(delayMs: number) {
    this.slow.delayMs = delayMs;
    await this.eventsService.create({
      type: 'SIMULATED_ERROR',
      message:
        delayMs > 0
          ? `Slow response simulation enabled (${delayMs}ms)`
          : 'Slow response simulation disabled',
      metadata: { kind: 'slow', delayMs },
    });
    this.logger.info('Slow failure simulation updated', { delayMs }, 'FailureService');
    return this.getStatus();
  }

  async setErrorRate(percentage: number, durationSeconds: number) {
    if (percentage <= 0) {
      this.errorRate = null;
    } else {
      this.errorRate = {
        percentage,
        expiresAt: Date.now() + durationSeconds * 1000,
      };
    }

    await this.eventsService.create({
      type: 'SIMULATED_ERROR',
      message:
        percentage > 0
          ? `Error rate simulation enabled (${percentage}% for ${durationSeconds}s)`
          : 'Error rate simulation disabled',
      metadata: { kind: 'error_rate', percentage, durationSeconds },
    });

    this.logger.info(
      'Error rate simulation updated',
      { percentage, durationSeconds },
      'FailureService',
    );
    return this.getStatus();
  }

  async setDatabaseUnavailable(enabled: boolean, durationSeconds?: number) {
    this.dbUnavailable = {
      enabled,
      expiresAt:
        enabled && durationSeconds
          ? Date.now() + durationSeconds * 1000
          : enabled
            ? null
            : null,
    };
    if (!enabled) {
      this.dbUnavailable.enabled = false;
      this.dbUnavailable.expiresAt = null;
    }

    await this.eventsService.create({
      type: 'SIMULATED_ERROR',
      message: enabled
        ? 'Database unavailable simulation enabled'
        : 'Database unavailable simulation disabled',
      metadata: { kind: 'database_unavailable', enabled, durationSeconds },
    });

    this.logger.info(
      'Database unavailable simulation updated',
      { enabled, durationSeconds },
      'FailureService',
    );
    return this.getStatus();
  }

  getSlowDelayMs(): number {
    return this.slow.delayMs;
  }

  shouldInjectError(): boolean {
    this.cleanupExpired();
    if (!this.errorRate) return false;
    return Math.random() * 100 < this.errorRate.percentage;
  }

  isDatabaseUnavailable(): boolean {
    this.cleanupExpired();
    return this.dbUnavailable.enabled;
  }

  assertDatabaseAvailable() {
    if (this.isDatabaseUnavailable()) {
      throw new ServiceUnavailableException({
        message: 'Database unavailable (simulation)',
        simulated: true,
      });
    }
  }

  private cleanupExpired() {
    if (this.errorRate && Date.now() >= this.errorRate.expiresAt) {
      this.errorRate = null;
    }
    if (
      this.dbUnavailable.enabled &&
      this.dbUnavailable.expiresAt &&
      Date.now() >= this.dbUnavailable.expiresAt
    ) {
      this.dbUnavailable.enabled = false;
      this.dbUnavailable.expiresAt = null;
    }
  }
}
