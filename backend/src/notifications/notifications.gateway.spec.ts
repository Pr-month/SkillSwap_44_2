import { Test, TestingModule } from '@nestjs/testing';
import { JwtModule } from '@nestjs/jwt';
import { NotificationsGateway } from './notifications.gateway';
import { WsJwtGuard } from '../auth/guards/ws-jwt.guard';
import { JwtPayload } from '../auth/auth.types';

describe('NotificationsGateway', () => {
  let gateway: NotificationsGateway;

  const mockWsJwtGuard = {
    verify: jest.fn(),
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
        role: 'USER' as any,
      };
      const client = {
        handshake: { query: { token: 'valid-token' } },
        data: {},
        join: jest.fn(),
        disconnect: jest.fn(),
      } as any;

      mockWsJwtGuard.verify.mockResolvedValue(payload);

      await gateway.handleConnection(client);

      expect(mockWsJwtGuard.verify).toHaveBeenCalledWith('valid-token');
      expect(client.data.userId).toBe('user-id');
      expect(client.join).toHaveBeenCalledWith('user-id');
      expect(client.disconnect).not.toHaveBeenCalled();
    });

    it('should disconnect client when token is missing', async () => {
      const client = {
        handshake: { query: {} },
        data: {},
        join: jest.fn(),
        disconnect: jest.fn(),
      } as any;

      mockWsJwtGuard.verify.mockRejectedValue(new Error('Missing token'));

      await gateway.handleConnection(client);

      expect(client.disconnect).toHaveBeenCalledWith(true);
      expect(client.join).not.toHaveBeenCalled();
    });

    it('should disconnect client when token is invalid', async () => {
      const client = {
        handshake: { query: { token: 'bad-token' } },
        data: {},
        join: jest.fn(),
        disconnect: jest.fn(),
      } as any;

      mockWsJwtGuard.verify.mockRejectedValue(new Error('Invalid token'));

      await gateway.handleConnection(client);

      expect(mockWsJwtGuard.verify).toHaveBeenCalledWith('bad-token');
      expect(client.disconnect).toHaveBeenCalledWith(true);
      expect(client.join).not.toHaveBeenCalled();
    });

    it('should initialise data object if client.data is null', async () => {
      const payload: JwtPayload = {
        sub: 'user-id',
        email: 'test@test.com',
        role: 'USER' as any,
      };
      const client = {
        handshake: { query: { token: 'valid-token' } },
        data: null,
        join: jest.fn(),
        disconnect: jest.fn(),
      } as any;

      mockWsJwtGuard.verify.mockResolvedValue(payload);

      await gateway.handleConnection(client);

      expect(client.data.userId).toBe('user-id');
      expect(client.join).toHaveBeenCalledWith('user-id');
    });
  });

  describe('handleDisconnect', () => {
    it('should not throw', () => {
      const client = {} as any;

      expect(() => gateway.handleDisconnect(client)).not.toThrow();
    });
  });

  describe('notifyUser', () => {
    it('should emit notification event to user room', () => {
      const emit = jest.fn();
      const to = jest.fn(() => ({ emit }));
      gateway.server = { to } as any;

      const payload = { message: 'Hello', type: 'test' };
      gateway.notifyUser('user-id', payload);

      expect(to).toHaveBeenCalledWith('user-id');
      expect(emit).toHaveBeenCalledWith('notification', payload);
    });
  });
});
