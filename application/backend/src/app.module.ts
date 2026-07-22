import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { CommonModule } from './common/common.module';
import { HealthModule } from './health/health.module';
import { RecordsModule } from './records/records.module';
import { LoadTestingModule } from './load-testing/load-testing.module';
import { MetricsModule } from './metrics/metrics.module';
import { EventsModule } from './events/events.module';
import { SystemModule } from './system/system.module';
import { FailureModule } from './failure/failure.module';
import { MetricsInterceptor } from './common/metrics.interceptor';
import {
  FailureInterceptor,
  FailureMiddleware,
} from './common/failure.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    CommonModule,
    MetricsModule,
    EventsModule,
    FailureModule,
    HealthModule,
    RecordsModule,
    LoadTestingModule,
    SystemModule,
  ],
  providers: [
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: MetricsInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: FailureInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(FailureMiddleware).forRoutes('*');
  }
}
