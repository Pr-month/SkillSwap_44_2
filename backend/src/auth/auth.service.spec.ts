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

interface MockedUsersService {
  create: jest.Mock;
  findByEmail: jest.Mock;
  findOne: jest.Mock;
  update: jest.Mock;
}

interface MockedJwtService {
  signAsync: jest.Mock;
  verifyAsync: jest.Mock;
}

describe('AuthService', () => {
  let service: AuthService;
  let usersService: MockedUsersService;
  let jwtService: MockedJwtService;

  const mockJwtConfig: TJwtConfig = {
    accessSecret: 'access-secret',
    refreshSecret: 'refresh-secret',
    accessExpiresIn: '15m',
    refreshExpiresIn: '7d',
  };

  beforeEach(async () => {
    const mockUsersService = {
      create: jest.fn(),
      findByEmail: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
    };

    const mockJwtService = {
      signAsync: jest.fn(),
      verifyAsync: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: jwtConfig.KEY, useValue: mockJwtConfig },
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get(AuthService);
    usersService = module.get(UsersService);
    jwtService = module.get(JwtService);
  });

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
        .mockResolvedValue('hashed-password') as jest.MockedFunction<
        typeof bcrypt.hash
      >;

      Object.defineProperty(bcrypt, 'hash', {
        value: mockHash,
        writable: true,
        configurable: true,
      });

      const expectedUser: User = createMockUser({
        id: 'new-user-id',
        name: dto.name,
        email: dto.email,
        password: 'hashed-password',
        birthdate: new Date(dto.birthdate),
        city: dto.city,
        gender: dto.gender,
      });

      usersService.create.mockResolvedValue(expectedUser);

      const result = await service.register(dto);

      expect(mockHash).toHaveBeenCalledWith(dto.password, 10);
      expect(usersService.create).toHaveBeenCalledWith({
        ...dto,
        password: 'hashed-password',
      });
      expect(result).toEqual(expectedUser);
    });
  });

  describe('login', () => {
    it('should login with valid credentials and return tokens', async () => {
      const dto = { email: 'test@example.com', password: 'plain-password' };
      const user: User = createMockUser({ email: dto.email });

      usersService.findByEmail.mockResolvedValue(user);

      const mockCompare = jest
        .fn()
        .mockResolvedValue(true) as jest.MockedFunction<typeof bcrypt.compare>;

      Object.defineProperty(bcrypt, 'compare', {
        value: mockCompare,
        writable: true,
        configurable: true,
      });

      jwtService.signAsync
        .mockResolvedValueOnce('access-token')
        .mockResolvedValueOnce('refresh-token');

      const result = await service.login(dto);

      expect(usersService.findByEmail).toHaveBeenCalledWith(dto.email);
      expect(mockCompare).toHaveBeenCalledWith(dto.password, user.password);
      expect(jwtService.signAsync).toHaveBeenCalledTimes(2);
      expect(usersService.update).toHaveBeenCalledWith(user.id, {
        refreshToken: 'refresh-token',
      });

      expect(result.success).toBe(true);
      expect(result.accessToken).toBe('access-token');
      expect(result.refreshToken).toBe('refresh-token');

      const safeUser = result.user as Partial<User>;
      expect(safeUser.password).toBeUndefined();
      expect(safeUser.refreshToken).toBeUndefined();
    });

    it('should throw UnauthorizedException for invalid credentials', async () => {
      const dto = { email: 'test@example.com', password: 'wrong' };

      usersService.findByEmail.mockResolvedValue(null);

      await expect(service.login(dto)).rejects.toThrow(UnauthorizedException);
      expect(usersService.findByEmail).toHaveBeenCalledWith(dto.email);
    });
  });

  describe('refresh', () => {
    it('should refresh tokens when refresh token is valid and matches DB', async () => {
      const refreshToken = 'old-refresh-token';
      const payload = {
        sub: 'user-123',
        email: 'x@x.com',
        role: UserRole.USER,
      };
      const user: User = createMockUser({ id: payload.sub, refreshToken });

      jwtService.verifyAsync.mockResolvedValue(payload);
      usersService.findOne.mockResolvedValue(user);

      jwtService.signAsync
        .mockResolvedValueOnce('new-access')
        .mockResolvedValueOnce('new-refresh');

      const result = await service.refresh(refreshToken);

      expect(jwtService.verifyAsync).toHaveBeenCalledWith(refreshToken, {
        secret: mockJwtConfig.refreshSecret,
      });
      expect(usersService.findOne).toHaveBeenCalledWith(payload.sub);
      expect(user.refreshToken).toEqual(refreshToken);
      expect(usersService.update).toHaveBeenCalledWith(user.id, {
        refreshToken: 'new-refresh',
      });
      expect(result.accessToken).toBe('new-access');
      expect(result.refreshToken).toBe('new-refresh');
    });

    it('should throw UnauthorizedException when refresh token does not match DB', async () => {
      const refreshToken = 'stolen-refresh-token';
      const payload = { sub: 'user-123' };
      const user: User = createMockUser({
        id: payload.sub,
        refreshToken: 'different-token',
      });

      jwtService.verifyAsync.mockResolvedValue(payload);
      usersService.findOne.mockResolvedValue(user);

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
      expect(usersService.update).toHaveBeenCalledWith(id, {
        refreshToken: null,
      });
    });
  });
});
