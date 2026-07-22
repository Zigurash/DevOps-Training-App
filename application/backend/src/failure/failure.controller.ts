import { Body, Controller, Get, Post } from '@nestjs/common';
import { FailureService } from './failure.service';
import {
  DatabaseUnavailableDto,
  ErrorRateDto,
  SlowFailureDto,
} from './dto/failure.dto';

@Controller('api/failure')
export class FailureController {
  constructor(private readonly failureService: FailureService) {}

  @Get('status')
  status() {
    return this.failureService.getStatus();
  }

  @Post('slow')
  setSlow(@Body() dto: SlowFailureDto) {
    return this.failureService.setSlow(dto.delayMs);
  }

  @Post('error-rate')
  setErrorRate(@Body() dto: ErrorRateDto) {
    return this.failureService.setErrorRate(dto.percentage, dto.durationSeconds);
  }

  @Post('database')
  setDatabaseUnavailable(@Body() dto: DatabaseUnavailableDto) {
    return this.failureService.setDatabaseUnavailable(
      dto.enabled,
      dto.durationSeconds,
    );
  }
}
