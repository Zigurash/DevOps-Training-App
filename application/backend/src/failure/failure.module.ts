import { Module, Global } from '@nestjs/common';
import { FailureController } from './failure.controller';
import { FailureService } from './failure.service';
import { EventsModule } from '../events/events.module';

@Global()
@Module({
  imports: [EventsModule],
  controllers: [FailureController],
  providers: [FailureService],
  exports: [FailureService],
})
export class FailureModule {}
