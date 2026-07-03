import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
import { ValidationPipe, ClassSerializerInterceptor } from '@nestjs/common';
import { appConfig, AppConfig } from './config/app.config';
import { AllExceptionsFilter } from './common/all-exception.filter';
import * as express from 'express';
import path from 'path';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { SWAGGER_AUTH_SCHEME_NAME } from './config/swagger.config';

dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(
    '/uploads',
    express.static(path.join(process.cwd(), 'public', 'uploads')),
  );

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));
  app.useGlobalFilters(new AllExceptionsFilter());

  const configBuilder = new DocumentBuilder()
    .setTitle('API проекта Skill Swap')
    .setDescription('Документация API для управления навыками, пользователями и избранным')
    .setVersion('1.0')    
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
      SWAGGER_AUTH_SCHEME_NAME,
    )
    .build();

  const document = SwaggerModule.createDocument(app, configBuilder);
  SwaggerModule.setup('api', app, document);

  const config = app.get<AppConfig>(appConfig.KEY);
  await app.listen(config.port);
  console.log(`Application running on port ${config.port}`);
  console.log(`Swagger UI available at http://localhost:${config.port}/api`);
}

bootstrap();
