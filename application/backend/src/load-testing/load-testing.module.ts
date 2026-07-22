import { Module } from '@nestjs/common';
import { LoadTestingController } from './load-testing.controller';
import { LoadTestingService } from './load-testing.service';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [EventsModule],
  controllers: [LoadTestingController],
  providers: [LoadTestingService],
  exports: [LoadTestingService],
})
export class LoadTestingModule {}
