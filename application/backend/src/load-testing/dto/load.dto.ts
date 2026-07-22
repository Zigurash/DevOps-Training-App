import {
  IsInt,
  IsString,
  Max,
  Min,
  IsIn,
} from 'class-validator';

export class CpuLoadDto {
  @IsInt()
  @Min(1)
  @Max(60)
  durationSeconds!: number;

  @IsInt()
  @Min(1)
  @Max(4)
  workers!: number;
}

export class DatabaseLoadDto {
  @IsInt()
  @Min(1)
  @Max(5000)
  operations!: number;

  @IsInt()
  @Min(1)
  @Max(20)
  concurrency!: number;
}

export class HttpLoadDto {
  @IsInt()
  @Min(1)
  @Max(1000)
  requests!: number;

  @IsInt()
  @Min(1)
  @Max(20)
  concurrency!: number;

  @IsString()
  @IsIn(['/api/health', '/api/health/live', '/api/health/ready', '/api/system/info', '/api/records', '/api/events', '/api/metrics'])
  endpoint!: string;
}
