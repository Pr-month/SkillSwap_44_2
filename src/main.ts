import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { appConfig, AppConfig } from './config/app.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get<AppConfig>(appConfig.KEY);
  await app.listen(config.port);
  console.log(`Application running on port ${config.port}`);
}
bootstrap();