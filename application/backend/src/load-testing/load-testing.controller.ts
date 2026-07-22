import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { LoadTestingService } from './load-testing.service';
import { CpuLoadDto, DatabaseLoadDto, HttpLoadDto } from './dto/load.dto';

@Controller('api/load')
export class LoadTestingController {
  constructor(private readonly loadTestingService: LoadTestingService) {}

  @Post('cpu')
  startCpu(@Body() dto: CpuLoadDto) {
    return this.loadTestingService.startCpuLoad(dto);
  }

  @Post('database')
  startDatabase(@Body() dto: DatabaseLoadDto) {
    return this.loadTestingService.startDatabaseLoad(dto);
  }

  @Post('http')
  startHttp(@Body() dto: HttpLoadDto) {
    return this.loadTestingService.startHttpLoad(dto);
  }

  @Get('jobs')
  listJobs() {
    return this.loadTestingService.listJobs();
  }

  @Get('jobs/:id')
  getJob(@Param('id') id: string) {
    return this.loadTestingService.getJob(id);
  }
}
