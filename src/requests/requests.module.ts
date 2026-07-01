import { Module } from '@nestjs/common';
import { RequestsService } from './requests.service';
import { RequestsController } from './requests.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Request } from './entities/request.entity';
import { Skill } from '../skills/entities/skill.entity';
import { User } from '../users/entities/user.entity';
import { NotificationsModule } from '../notifications/notifications.module'; // добавить

@Module({
  imports: [
    TypeOrmModule.forFeature([Request, Skill, User]),
    NotificationsModule, // добавить
  ],
  controllers: [RequestsController],
  providers: [RequestsService],
})
export class RequestsModule {}