import {
  IsBoolean,
  IsInt,
  IsNumber,
  Max,
  Min,
  IsOptional,
} from 'class-validator';

export class SlowFailureDto {
  @IsInt()
  @Min(0)
  @Max(30000)
  delayMs!: number;
}

export class ErrorRateDto {
  @IsNumber()
  @Min(0)
  @Max(100)
  percentage!: number;

  @IsInt()
  @Min(1)
  @Max(600)
  durationSeconds!: number;
}

export class DatabaseUnavailableDto {
  @IsBoolean()
  enabled!: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(600)
  durationSeconds?: number;
}
