import { Controller, Get, Query } from '@nestjs/common';
import { EventsService } from './events.service';

@Controller('api/events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get()
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('type') type?: string,
  ) {
    return this.eventsService.findAll({
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
      type,
    });
  }
}
