import { Test, TestingModule } from '@nestjs/testing';
import { HealthService } from './health.service';
import { PrismaService } from '../common/prisma.service';
import { FailureService } from '../failure/failure.service';
import { EventsService } from '../events/events.service';

describe('HealthService', () => {
  let service: HealthService;
  let prisma: { $queryRaw: jest.Mock };
  let failureService: {
    isDatabaseUnavailable: jest.Mock;
  };
  let eventsService: { create: jest.Mock };

  beforeEach(async () => {
    prisma = { $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }]) };
    failureService = { isDatabaseUnavailable: jest.fn().mockReturnValue(false) };
    eventsService = { create: jest.fn().mockResolvedValue({}) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HealthService,
        { provide: PrismaService, useValue: prisma },
        { provide: FailureService, useValue: failureService },
        { provide: EventsService, useValue: eventsService },
      ],
    }).compile();

    service = module.get(HealthService);
  });

  it('returns ok when database is connected', async () => {
    const result = await service.check();
    expect(result.status).toBe('ok');
    expect(result.database.status).toBe('connected');
    expect(typeof result.uptime).toBe('number');
  });

  it('live always returns ok', () => {
    expect(service.live().status).toBe('ok');
  });

  it('ready throws when database simulation is active', async () => {
    failureService.isDatabaseUnavailable.mockReturnValue(true);
    await expect(service.ready()).rejects.toThrow();
  });
});
