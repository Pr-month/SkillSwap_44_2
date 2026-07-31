import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { NotificationsGateway } from './notifications.gateway';
import { WsJwtGuard } from 'src/auth/guards/ws-jwt.guard';

@Module({
  imports: [JwtModule.register({})],
  providers: [NotificationsGateway, WsJwtGuard],
  exports: [NotificationsGateway],
})
export class NotificationsModule {}
