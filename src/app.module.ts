import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { dbConfig, TDbConfig } from './config/db.config';
import { SkillsModule } from './skills/skills.module';
import { configLoaders } from './config/configuration';
import { FilesModule } from './files/files.module';
import { RequestsModule } from './requests/requests.module';
import { CategoriesModule } from './categories/categories.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // делаем конфиг доступным везде без импорта ConfigModule в другие модули
      load: configLoaders, // подключаем все конфиги
    }),
    TypeOrmModule.forRootAsync({
      inject: [dbConfig.KEY],
      useFactory: (db: TDbConfig) => db,
    }),
    UsersModule,
    AuthModule,
    SkillsModule,
    FilesModule,
    RequestsModule,
    CategoriesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
