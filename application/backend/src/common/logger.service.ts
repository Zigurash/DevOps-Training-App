import {
  Injectable,
  LoggerService,
  LogLevel,
  ConsoleLogger,
} from '@nestjs/common';

@Injectable()
export class AppLogger implements LoggerService {
  private readonly logger = new ConsoleLogger();

  private format(
    level: string,
    message: unknown,
    context?: string,
    meta?: Record<string, unknown>,
  ): string {
    return JSON.stringify({
      timestamp: new Date().toISOString(),
      level,
      message: typeof message === 'string' ? message : JSON.stringify(message),
      ...(context ? { context } : {}),
      ...(meta ?? {}),
    });
  }

  log(message: unknown, context?: string) {
    process.stdout.write(this.format('info', message, context) + '\n');
  }

  error(message: unknown, trace?: string, context?: string) {
    process.stderr.write(
      this.format('error', message, context, trace ? { trace } : undefined) +
        '\n',
    );
  }

  warn(message: unknown, context?: string) {
    process.stdout.write(this.format('warn', message, context) + '\n');
  }

  debug?(message: unknown, context?: string) {
    process.stdout.write(this.format('debug', message, context) + '\n');
  }

  verbose?(message: unknown, context?: string) {
    process.stdout.write(this.format('verbose', message, context) + '\n');
  }

  setLogLevels?(levels: LogLevel[]) {
    this.logger.setLogLevels(levels);
  }

  info(message: string, meta?: Record<string, unknown>, context?: string) {
    process.stdout.write(this.format('info', message, context, meta) + '\n');
  }
}
