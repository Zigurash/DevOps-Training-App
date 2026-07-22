import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, RecordStatus } from '@prisma/client';
import { PrismaService } from '../common/prisma.service';
import { EventsService } from '../events/events.service';
import { MetricsService } from '../metrics/metrics.service';
import { FailureService } from '../failure/failure.service';
import {
  CreateRecordDto,
  QueryRecordsDto,
  UpdateRecordDto,
} from './dto/records.dto';

@Injectable()
export class RecordsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventsService: EventsService,
    private readonly metrics: MetricsService,
    private readonly failureService: FailureService,
  ) {}

  private assertDatabaseAvailable() {
    this.failureService.assertDatabaseAvailable();
  }

  async findAll(query: QueryRecordsDto) {
    this.assertDatabaseAvailable();

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;
    const sortBy = ['createdAt', 'updatedAt', 'title'].includes(
      query.sortBy ?? '',
    )
      ? (query.sortBy as 'createdAt' | 'updatedAt' | 'title')
      : 'createdAt';
    const sortOrder = query.sortOrder === 'asc' ? 'asc' : 'desc';

    const where: Prisma.RecordWhereInput = {};
    if (query.status) {
      where.status = query.status;
    }
    if (query.search) {
      where.title = { contains: query.search, mode: 'insensitive' };
    }

    const [items, total] = await Promise.all([
      this.prisma.record.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      this.prisma.record.count({ where }),
    ]);

    return {
      items,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async findOne(id: string) {
    this.assertDatabaseAvailable();
    const record = await this.prisma.record.findUnique({ where: { id } });
    if (!record) {
      throw new NotFoundException(`Record ${id} not found`);
    }
    return record;
  }

  async create(dto: CreateRecordDto) {
    this.assertDatabaseAvailable();
    const record = await this.prisma.record.create({
      data: {
        title: dto.title,
        description: dto.description,
        status: dto.status ?? RecordStatus.active,
      },
    });

    this.metrics.recordsCreatedTotal.inc();
    await this.eventsService.create({
      type: 'RECORD_CREATED',
      message: `Record created: ${record.title}`,
      metadata: { recordId: record.id, status: record.status },
    });

    return record;
  }

  async update(id: string, dto: UpdateRecordDto) {
    this.assertDatabaseAvailable();
    await this.findOne(id);

    const record = await this.prisma.record.update({
      where: { id },
      data: {
        ...(dto.title !== undefined ? { title: dto.title } : {}),
        ...(dto.description !== undefined
          ? { description: dto.description }
          : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
      },
    });

    await this.eventsService.create({
      type: 'RECORD_UPDATED',
      message: `Record updated: ${record.title}`,
      metadata: { recordId: record.id, status: record.status },
    });

    return record;
  }

  async remove(id: string) {
    this.assertDatabaseAvailable();
    await this.findOne(id);
    await this.prisma.record.delete({ where: { id } });
    await this.eventsService.create({
      type: 'RECORD_DELETED',
      message: `Record deleted: ${id}`,
      metadata: { recordId: id },
    });
    return { deleted: true, id };
  }
}
