import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtPayload } from '../auth/auth.types';
import { WsJwtGuard } from '../auth/guards/ws-jwt.guard';

interface ClientData {
  userId?: string;
}

@WebSocketGateway({ cors: true })
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  constructor(private readonly wsJwtGuard: WsJwtGuard) {}

  async handleConnection(client: Socket) {
    const token = client.handshake.query?.token as string | undefined;
    let payload: JwtPayload;

    try {
      payload = await this.wsJwtGuard.verify(token);
    } catch (_e) {
      client.disconnect(true);
      return;
    }

    const data = (client.data ?? {}) as ClientData;
    data.userId = payload.sub;
    client.data = data;

    void client.join(payload.sub);
  }

  handleDisconnect(_client: Socket) {
    // освобождаем ресурсы при необходимости
  }

  notifyUser(userId: string, payload: unknown) {
    void this.server.to(userId).emit('notification', payload);
  }
}
