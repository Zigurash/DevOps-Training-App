import { Test, TestingModule } from '@nestjs/testing';
import { RecordsService } from './records.service';
import { PrismaService } from '../common/prisma.service';
import { EventsService } from '../events/events.service';
import { MetricsService } from '../metrics/metrics.service';
import { FailureService } from '../failure/failure.service';
import { NotFoundException } from '@nestjs/common';

describe('RecordsService', () => {
  let service: RecordsService;
  let prisma: {
    record: {
      findMany: jest.Mock;
      count: jest.Mock;
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
  };

  beforeEach(async () => {
    prisma = {
      record: {
        findMany: jest.fn(),
        count: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecordsService,
        { provide: PrismaService, useValue: prisma },
        {
          provide: EventsService,
          useValue: { create: jest.fn().mockResolvedValue({}) },
        },
        {
          provide: MetricsService,
          useValue: { recordsCreatedTotal: { inc: jest.fn() } },
        },
        {
          provide: FailureService,
          useValue: { assertDatabaseAvailable: jest.fn() },
        },
      ],
    }).compile();

    service = module.get(RecordsService);
  });

  it('creates a record and returns it', async () => {
    const created = {
      id: '1',
      title: 'Test',
      description: 'Desc',
      status: 'active',
    };
    prisma.record.create.mockResolvedValue(created);

    const result = await service.create({ title: 'Test', description: 'Desc' });
    expect(result).toEqual(created);
    expect(prisma.record.create).toHaveBeenCalled();
  });

  it('throws when record is missing', async () => {
    prisma.record.findUnique.mockResolvedValue(null);
    await expect(service.findOne('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('paginates records', async () => {
    prisma.record.findMany.mockResolvedValue([]);
    prisma.record.count.mockResolvedValue(0);
    const result = await service.findAll({ page: 1, limit: 10 });
    expect(result.meta.total).toBe(0);
    expect(result.meta.page).toBe(1);
  });
});
