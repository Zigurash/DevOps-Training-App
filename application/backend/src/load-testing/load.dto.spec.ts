import 'reflect-metadata';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CpuLoadDto, DatabaseLoadDto, HttpLoadDto } from './dto/load.dto';
import { CreateRecordDto } from '../records/dto/records.dto';

describe('Validation DTOs', () => {
  it('rejects CPU duration above max', async () => {
    const dto = plainToInstance(CpuLoadDto, {
      durationSeconds: 999,
      workers: 1,
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('accepts valid CPU load dto', async () => {
    const dto = plainToInstance(CpuLoadDto, {
      durationSeconds: 5,
      workers: 2,
    });
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('rejects database operations above max', async () => {
    const dto = plainToInstance(DatabaseLoadDto, {
      operations: 100000,
      concurrency: 5,
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('rejects non-whitelisted HTTP endpoint', async () => {
    const dto = plainToInstance(HttpLoadDto, {
      requests: 10,
      concurrency: 2,
      endpoint: '/api/admin/delete-all',
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('rejects empty record title', async () => {
    const dto = plainToInstance(CreateRecordDto, { title: '' });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});
