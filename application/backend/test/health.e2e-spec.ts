import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { HealthController } from '../src/health/health.controller';
import { HealthService } from '../src/health/health.service';

describe('Health (e2e smoke)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: HealthService,
          useValue: {
            check: jest.fn().mockResolvedValue({
              status: 'ok',
              timestamp: new Date().toISOString(),
              hostname: 'test',
              version: '1.0.0',
              uptime: 1,
              database: { status: 'connected', latencyMs: 1 },
            }),
            live: jest.fn().mockReturnValue({ status: 'ok' }),
            ready: jest.fn().mockResolvedValue({ status: 'ready' }),
          },
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('GET /api/health returns successful response', async () => {
    const res = await request(app.getHttpServer()).get('/api/health').expect(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.database.status).toBe('connected');
  });

  it('GET /api/health/live returns ok', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/health/live')
      .expect(200);
    expect(res.body.status).toBe('ok');
  });
});
