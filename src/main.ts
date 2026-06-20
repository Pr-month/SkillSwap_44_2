import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
import { ValidationPipe, ClassSerializerInterceptor } from '@nestjs/common';
import { appConfig, AppConfig } from './config/app.config';
import { AllExceptionsFilter } from './common/all-exception.filter';
import * as express from 'express';
import path from 'path';

dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(
    '/uploads',
    express.static(path.join(__dirname, 'public', 'uploads')),
  );

  app.useGlobalPipes(new ValidationPipe());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));
  app.useGlobalFilters(new AllExceptionsFilter());

  const config = app.get<AppConfig>(appConfig.KEY);
  await app.listen(config.port);
  console.log(`Application running on port ${config.port}`);
}
bootstrap();
