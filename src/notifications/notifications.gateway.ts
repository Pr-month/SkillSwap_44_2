import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Inject, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { jwtConfig, TJwtConfig } from '../config/jwt.config';
import { JwtPayload } from '../auth/auth.types';

@WebSocketGateway({ cors: true })
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly jwtService: JwtService,
    @Inject(jwtConfig.KEY)
    private readonly jwtConfig: TJwtConfig,
  ) { }

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.query.token as string;
      if (!token) {
        throw new UnauthorizedException('No token provided');
      }
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: this.jwtConfig.accessSecret,
      });
      client.join(payload.sub);
      client.data.userId = payload.sub;
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    // освобождаем ресурсы при необходимости
  }

  notifyUser(userId: string, payload: any) {
    this.server.to(userId).emit('notification', payload);
  }
}