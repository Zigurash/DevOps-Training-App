import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AppLogger } from './common/logger.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const logger = app.get(AppLogger);
  app.useLogger(logger);

  app.enableCors({
    origin: true,
    credentials: true,
  });

  const port = Number(process.env.PORT || 3000);
  await app.listen(port, '0.0.0.0');

  logger.info(
    'Backend started',
    {
      port,
      version: process.env.APP_VERSION || '1.0.0',
      env: process.env.NODE_ENV || 'development',
    },
    'Bootstrap',
  );
}

bootstrap();
