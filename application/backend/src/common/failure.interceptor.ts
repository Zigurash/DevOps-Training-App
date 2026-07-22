import {
  Injectable,
  NestMiddleware,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { Observable, throwError } from 'rxjs';
import { FailureService } from '../failure/failure.service';

@Injectable()
export class FailureInterceptor implements NestInterceptor {
  constructor(private readonly failureService: FailureService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<Request>();

    if (req.path.startsWith('/api/failure') || req.path.startsWith('/api/health/live')) {
      return next.handle();
    }

    if (this.failureService.shouldInjectError()) {
      return throwError(
        () =>
          new HttpException(
            {
              statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
              message: 'Simulated failure (error-rate injection)',
              simulated: true,
            },
            HttpStatus.INTERNAL_SERVER_ERROR,
          ),
      );
    }

    return next.handle();
  }
}

@Injectable()
export class FailureMiddleware implements NestMiddleware {
  constructor(private readonly failureService: FailureService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    if (req.path.startsWith('/api/failure') || req.path.startsWith('/api/health/live')) {
      return next();
    }

    const delay = this.failureService.getSlowDelayMs();
    if (delay > 0) {
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
    next();
  }
}
