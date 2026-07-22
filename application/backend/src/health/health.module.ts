import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';
import { FailureModule } from '../failure/failure.module';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [FailureModule, EventsModule],
  controllers: [HealthController],
  providers: [HealthService],
  exports: [HealthService],
})
export class HealthModule {}
