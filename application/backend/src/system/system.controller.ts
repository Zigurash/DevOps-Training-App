import { Controller, Get } from '@nestjs/common';
import { SystemService } from './system.service';

@Controller('api/system')
export class SystemController {
  constructor(private readonly systemService: SystemService) {}

  @Get('info')
  getInfo() {
    return this.systemService.getInfo();
  }
}
