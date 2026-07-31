import { Test, TestingModule } from '@nestjs/testing';
import { JwtModule } from '@nestjs/jwt';
import { NotificationsGateway } from './notifications.gateway';
import { WsJwtGuard } from '../auth/guards/ws-jwt.guard';
import { JwtPayload } from '../auth/auth.types';
import { UserRole } from '../users/enums/users.enums';
import { Socket, Server } from 'socket.io';

interface MockClientShape {
  handshake: {
    query: {
      token?: string;
    };
  };
  data: Record<string, unknown> | null;
  join: jest.MockedFunction<(room: string) => void>;
  disconnect: jest.MockedFunction<(close: boolean) => void>;
}

interface MockServerShape {
  to: (room: string) => {
    emit: (event: string, payload: unknown) => void;
  };
}

describe('NotificationsGateway', () => {
  let gateway: NotificationsGateway;

  const mockWsJwtGuard = {
    verify: jest.fn() as jest.MockedFunction<
      (token: string) => Promise<JwtPayload> | Promise<never>
    >,
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      imports: [JwtModule.register({})],
      providers: [
        NotificationsGateway,
        {
          provide: WsJwtGuard,
          useValue: mockWsJwtGuard,
        },
      ],
    }).compile();

    gateway = module.get<NotificationsGateway>(NotificationsGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });

  describe('handleConnection', () => {
    it('should authenticate and join room when token is valid', async () => {
      const payload: JwtPayload = {
        sub: 'user-id',
        email: 'test@test.com',
        role: UserRole.USER,
      };

      const client: MockClientShape = {
        handshake: { query: { token: 'valid-token' } },
        data: {},
        join: jest.fn(),
        disconnect: jest.fn(),
      };

      mockWsJwtGuard.verify.mockResolvedValue(payload);

      await gateway.handleConnection(client as unknown as Socket);

      expect(mockWsJwtGuard.verify).toHaveBeenCalledWith('valid-token');

      expect((client.data as Record<string, unknown>).userId).toBe('user-id');
      expect(client.join).toHaveBeenCalledWith('user-id');
      expect(client.disconnect).not.toHaveBeenCalled();
    });

    it('should disconnect client when token is missing', async () => {
      const client: MockClientShape = {
        handshake: { query: {} },
        data: {},
        join: jest.fn(),
        disconnect: jest.fn(),
      };

      mockWsJwtGuard.verify.mockRejectedValue(new Error('Missing token'));

      await gateway.handleConnection(client as unknown as Socket);

      expect(client.disconnect).toHaveBeenCalledWith(true);
      expect(client.join).not.toHaveBeenCalled();
    });

    it('should disconnect client when token is invalid', async () => {
      const client: MockClientShape = {
        handshake: { query: { token: 'bad-token' } },
        data: {},
        join: jest.fn(),
        disconnect: jest.fn(),
      };

      mockWsJwtGuard.verify.mockRejectedValue(new Error('Invalid token'));

      await gateway.handleConnection(client as unknown as Socket);

      expect(mockWsJwtGuard.verify).toHaveBeenCalledWith('bad-token');
      expect(client.disconnect).toHaveBeenCalledWith(true);
      expect(client.join).not.toHaveBeenCalled();
    });

    it('should initialise data object if client.data is null', async () => {
      const payload: JwtPayload = {
        sub: 'user-id',
        email: 'test@test.com',
        role: UserRole.USER,
      };

      const client: MockClientShape = {
        handshake: { query: { token: 'valid-token' } },
        data: null,
        join: jest.fn(),
        disconnect: jest.fn(),
      };

      mockWsJwtGuard.verify.mockResolvedValue(payload);

      await gateway.handleConnection(client as unknown as Socket);

      expect((client.data as Record<string, unknown>).userId).toBe('user-id');
      expect(client.join).toHaveBeenCalledWith('user-id');
    });
  });

  describe('handleDisconnect', () => {
    it('should not throw', () => {
      const client: MockClientShape = {
        handshake: { query: {} },
        data: {},
        join: jest.fn(),
        disconnect: jest.fn(),
      };

      expect(() =>
        gateway.handleDisconnect(client as unknown as Socket),
      ).not.toThrow();
    });
  });

  describe('notifyUser', () => {
    it('should emit notification event to user room', () => {
      const mockEmit = jest.fn();
      const mockTo = jest.fn(() => ({ emit: mockEmit }));

      const mockServer: MockServerShape = {
        to: mockTo,
      };

      gateway.server = mockServer as unknown as Server;

      const payload = { message: 'Hello', type: 'test' };
      gateway.notifyUser('user-id', payload);

      expect(mockTo).toHaveBeenCalledWith('user-id');
      expect(mockEmit).toHaveBeenCalledWith('notification', payload);
    });
  });
});
