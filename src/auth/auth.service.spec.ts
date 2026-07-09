import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcryptjs';
import { UnauthorizedException } from '@nestjs/common';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { User } from '../users/entities/user.entity';
import { jwtConfig, TJwtConfig } from '../config/jwt.config';
import { UserGender, UserRole } from '../users/enums/users.enums';
import ms from 'ms';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let jwtService: jest.Mocked<JwtService>;

  const mockJwtConfig: TJwtConfig = {
    accessSecret: 'access-secret',
    refreshSecret: 'refresh-secret',
    accessExpiresIn: '15m' as ms.StringValue,
    refreshExpiresIn: '7d' as ms.StringValue,
  };

  beforeEach(async () => {
    // --- Автоматическое создание моков для всех методов UsersService ---
    const mockUsersService = Object.create(UsersService.prototype);
    for (const key of Object.getOwnPropertyNames(Object.getPrototypeOf(mockUsersService))) {
      if (typeof mockUsersService[key] === 'function') {
        mockUsersService[key] = jest.fn();
      }
    }

    // --- Автоматическое создание моков для всех методов JwtService ---
    const mockJwtService = Object.create(JwtService.prototype);
    for (const key of Object.getOwnPropertyNames(Object.getPrototypeOf(mockJwtService))) {
      if (typeof mockJwtService[key] === 'function') {
        mockJwtService[key] = jest.fn();
      }
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: jwtConfig.KEY, useValue: mockJwtConfig },
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get<jest.Mocked<UsersService>>(UsersService);
    jwtService = module.get<jest.Mocked<JwtService>>(JwtService);
  });

  // Хелпер для создания валидного мок-пользователя (учитывает все обязательные поля User)
  const createMockUser = (overrides?: Partial<User>): User => ({
    id: 'user-123',
    name: 'Test User',
    email: 'test@example.com',
    password: 'hashed-password',
    about: undefined,
    birthdate: new Date('1990-01-01'),
    city: 'Moscow',
    gender: UserGender.MALE,
    avatar: undefined,
    skills: [],
    wantToLearn: [],
    favoriteSkills: [],
    role: UserRole.USER,
    refreshToken: null,
    ...overrides,
  });

  describe('register', () => {
    it('should register user and hash password', async () => {
      const dto: CreateUserDto = {
        name: 'New User',
        email: 'new@example.com',
        password: 'plain-password',
        birthdate: '1995-05-20',
        city: 'Saint Petersburg',
        gender: UserGender.FEMALE,
      };

      const mockHash = jest
        .fn()
        .mockResolvedValue('hashed-password') as jest.MockedFunction<typeof bcrypt.hash>;
      
      // Подменяем метод в объекте bcrypt
      Object.defineProperty(bcrypt, 'hash', { value: mockHash, writable: true, configurable: true });

      const expectedUser: User = createMockUser({
        id: 'new-user-id',
        name: dto.name,
        email: dto.email,
        password: 'hashed-password',
        birthdate: new Date(dto.birthdate),
        city: dto.city,
        gender: dto.gender,
      });

      (usersService.create as jest.Mock).mockResolvedValue(expectedUser);

      const result = await service.register(dto);

      expect(mockHash).toHaveBeenCalledWith(dto.password, 10);
      expect(usersService.create).toHaveBeenCalledWith({
        ...dto,
        password: 'hashed-password',
        birthdate: expect.any(Date),
      });
      expect(result).toEqual(expectedUser);
    });
  });

  describe('login', () => {
    it('should login with valid credentials and return tokens', async () => {
      const dto = { email: 'test@example.com', password: 'plain-password' };
      const user: User = createMockUser({ email: dto.email });

      (usersService.findByEmail as jest.Mock).mockResolvedValue(user);
      
      const mockCompare = jest
        .fn()
        .mockResolvedValue(true) as jest.MockedFunction<typeof bcrypt.compare>;
      
      Object.defineProperty(bcrypt, 'compare', { value: mockCompare, writable: true, configurable: true });

      jwtService.signAsync
        .mockResolvedValueOnce('access-token')
        .mockResolvedValueOnce('refresh-token');

      const result = await service.login(dto);

      expect(usersService.findByEmail).toHaveBeenCalledWith(dto.email);
      expect(mockCompare).toHaveBeenCalledWith(dto.password, user.password);
      expect(jwtService.signAsync).toHaveBeenCalledTimes(2);
      expect(usersService.update).toHaveBeenCalledWith(user.id, { refreshToken: 'refresh-token' });

      expect(result.success).toBe(true);
      expect(result.accessToken).toBe('access-token');
      expect(result.refreshToken).toBe('refresh-token');

      // Проверка безопасности: чувствительные данные не возвращаются в ответе
      expect((result.user as any).password).toBeUndefined();
      expect((result.user as any).refreshToken).toBeUndefined();
    });

    it('should throw UnauthorizedException for invalid credentials', async () => {
      const dto = { email: 'test@example.com', password: 'wrong' };
      (usersService.findByEmail as jest.Mock).mockResolvedValue(null);

      await expect(service.login(dto)).rejects.toThrow(UnauthorizedException);
      expect(usersService.findByEmail).toHaveBeenCalledWith(dto.email);
    });
  });

  describe('refresh', () => {
    it('should refresh tokens when refresh token is valid and matches DB', async () => {
      const refreshToken = 'old-refresh-token';
      const payload = { sub: 'user-123', email: 'x@x.com', role: UserRole.USER };
      const user: User = createMockUser({ id: payload.sub, refreshToken });

      jwtService.verifyAsync.mockResolvedValue(payload);
      (usersService.findOne as jest.Mock).mockResolvedValue(user);

      jwtService.signAsync
        .mockResolvedValueOnce('new-access')
        .mockResolvedValueOnce('new-refresh');

      const result = await service.refresh(refreshToken);

      expect(jwtService.verifyAsync).toHaveBeenCalledWith(refreshToken, {
        secret: mockJwtConfig.refreshSecret,
      });
      expect(usersService.findOne).toHaveBeenCalledWith(payload.sub);
      expect(user.refreshToken).toEqual(refreshToken);
      expect(usersService.update).toHaveBeenCalledWith(user.id, { refreshToken: 'new-refresh' });
      expect(result.accessToken).toBe('new-access');
      expect(result.refreshToken).toBe('new-refresh');
    });

    it('should throw UnauthorizedException when refresh token does not match DB', async () => {
      const refreshToken = 'stolen-refresh-token';
      const payload = { sub: 'user-123' };
      const user: User = createMockUser({ id: payload.sub, refreshToken: 'different-token' });

      jwtService.verifyAsync.mockResolvedValue(payload as any);
      (usersService.findOne as jest.Mock).mockResolvedValue(user);

      await expect(service.refresh(refreshToken)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException on verifyAsync error', async () => {
      jwtService.verifyAsync.mockRejectedValue(new Error('expired'));

      await expect(service.refresh('bad-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('logout', () => {
    it('should clear refreshToken for user', async () => {
      const id = 'user-123';
      await service.logout(id);
      expect(usersService.update).toHaveBeenCalledWith(id, { refreshToken: null });
    });
  });
});
