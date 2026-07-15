import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { Response } from 'express';
import ms from 'ms';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;

  beforeEach(async () => {
    // Создаем пустой объект, который выглядит как экземпляр AuthService
    const mockService = Object.create(AuthService.prototype);
    
    // Проходимся по всем методам и делаем их jest.fn()
    for (const key of Object.getOwnPropertyNames(Object.getPrototypeOf(mockService))) {
      if (typeof mockService[key] === 'function') {
        mockService[key] = jest.fn();
      }
    }

    // Теперь безопасно приводим тип. Все методы есть, они просто пустые функции.
    authService = mockService as jest.Mocked<AuthService>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: authService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  describe('POST /auth/register', () => {
    it('should call authService.register with DTO', async () => {
      const dto = { email: 'test@example.com', password: 'secret', role: 'user' } as any;
      const mockUser = { id: 'user-123', ...dto } as any;
      authService.register.mockResolvedValue(mockUser);

      const result = await controller.register(dto);
      expect(authService.register).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockUser);
    });
  });

  describe('POST /auth/login', () => {
    it('should set refreshToken cookie and return response without refreshToken', async () => {
      const dto: LoginDto = { email: 'test@example.com', password: 'secret' };
      const mockResult = {
        success: true,
        user: { id: 'user-123', email: dto.email, role: 'user' },
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      } as any;

      authService.login.mockResolvedValue(mockResult);
      authService.getRefreshTokenExpiresIn.mockReturnValue('7d');

      const response = {
        cookie: jest.fn(),
        passthrough: true,
      } as unknown as Response;

      const result = await controller.login(dto, response);

      expect(authService.login).toHaveBeenCalledWith(dto);
      expect(response.cookie).toHaveBeenCalledWith('refreshToken', 'refresh-token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: ms('7d'),
      });
      // refreshToken не возвращается в теле ответа
      expect(result).toEqual({
        success: mockResult.success,
        user: mockResult.user,
        accessToken: mockResult.accessToken,
      });
    });
  });

  describe('POST /auth/logout/:id', () => {
    it('should call logout with userId', async () => {
      const id = 'user-123';
      await controller.logout(id);
      expect(authService.logout).toHaveBeenCalledWith(id);
    });
  });

  describe('POST /auth/refresh', () => {
    it('should call refresh with refreshToken from DTO', async () => {
      const dto: RefreshTokenDto = { refreshToken: 'old-token' };
      const mockResult = { accessToken: 'new-access', refreshToken: 'new-refresh' };
      authService.refresh.mockResolvedValue(mockResult);

      const result = await controller.refresh(dto);
      expect(authService.refresh).toHaveBeenCalledWith(dto.refreshToken);
      expect(result).toEqual(mockResult);
    });
  });
});
