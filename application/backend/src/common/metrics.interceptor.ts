import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { MetricsService } from '../metrics/metrics.service';

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(private readonly metrics: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const req = http.getRequest<Request>();
    const res = http.getResponse<Response>();

    if (!req.headers['x-request-id']) {
      req.headers['x-request-id'] = uuidv4();
    }
    res.setHeader('x-request-id', String(req.headers['x-request-id']));

    if (req.path === '/api/metrics') {
      return next.handle();
    }

    const start = process.hrtime.bigint();
    const method = req.method;
    const route = this.normalizeRoute(req);

    return next.handle().pipe(
      tap({
        next: () => {
          this.record(method, route, res.statusCode, start);
        },
        error: (err: { status?: number }) => {
          const status = err?.status ?? 500;
          this.record(method, route, status, start);
          this.metrics.httpRequestErrors.inc({
            method,
            route,
            status_code: String(status),
          });
        },
      }),
    );
  }

  private record(
    method: string,
    route: string,
    statusCode: number,
    start: bigint,
  ) {
    const durationNs = Number(process.hrtime.bigint() - start);
    const durationSec = durationNs / 1e9;
    const labels = {
      method,
      route,
      status_code: String(statusCode),
    };
    this.metrics.httpRequestsTotal.inc(labels);
    this.metrics.httpRequestDuration.observe(labels, durationSec);
  }

  private normalizeRoute(req: Request): string {
    const routePath = (req.route as { path?: string } | undefined)?.path;
    if (routePath) {
      const base = req.baseUrl || '';
      return `${base}${routePath}`.replace(/\/+/g, '/') || '/';
    }
    return req.path.split('?')[0] || '/';
  }
}
