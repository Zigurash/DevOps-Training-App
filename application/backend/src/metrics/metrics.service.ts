import { Injectable, OnModuleInit } from '@nestjs/common';
import {
  Registry,
  collectDefaultMetrics,
  Counter,
  Gauge,
  Histogram,
} from 'prom-client';

@Injectable()
export class MetricsService implements OnModuleInit {
  readonly registry = new Registry();

  readonly httpRequestsTotal: Counter<string>;
  readonly httpRequestDuration: Histogram<string>;
  readonly httpRequestErrors: Counter<string>;
  readonly activeLoadJobs: Gauge<string>;
  readonly cpuLoadJobsTotal: Counter<string>;
  readonly databaseLoadJobsTotal: Counter<string>;
  readonly httpLoadJobsTotal: Counter<string>;
  readonly recordsCreatedTotal: Counter<string>;

  constructor() {
    this.httpRequestsTotal = new Counter({
      name: 'http_requests_total',
      help: 'Total HTTP requests',
      labelNames: ['method', 'route', 'status_code'],
      registers: [this.registry],
    });

    this.httpRequestDuration = new Histogram({
      name: 'http_request_duration_seconds',
      help: 'HTTP request duration in seconds',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
      registers: [this.registry],
    });

    this.httpRequestErrors = new Counter({
      name: 'http_request_errors_total',
      help: 'Total HTTP request errors',
      labelNames: ['method', 'route', 'status_code'],
      registers: [this.registry],
    });

    this.activeLoadJobs = new Gauge({
      name: 'active_load_jobs',
      help: 'Number of active load jobs',
      labelNames: ['type'],
      registers: [this.registry],
    });

    this.cpuLoadJobsTotal = new Counter({
      name: 'cpu_load_jobs_total',
      help: 'Total CPU load jobs',
      labelNames: ['status'],
      registers: [this.registry],
    });

    this.databaseLoadJobsTotal = new Counter({
      name: 'database_load_jobs_total',
      help: 'Total database load jobs',
      labelNames: ['status'],
      registers: [this.registry],
    });

    this.httpLoadJobsTotal = new Counter({
      name: 'http_load_jobs_total',
      help: 'Total HTTP load jobs',
      labelNames: ['status'],
      registers: [this.registry],
    });

    this.recordsCreatedTotal = new Counter({
      name: 'records_created_total',
      help: 'Total records created',
      registers: [this.registry],
    });
  }

  onModuleInit() {
    collectDefaultMetrics({ register: this.registry });
  }

  async getMetrics(): Promise<string> {
    return this.registry.metrics();
  }
}
