import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { Response } from 'express';
import ms from 'ms';
import { LoginDto } from './dto/login.dto';
import { RegisterResponseDto } from './dto/register-response.dto';
import { LoginServiceResponseDto } from './dto/login-service-response.dto';
import { UserGender, UserRole } from 'src/users/enums/users.enums';
import { Skill } from 'src/skills/entities/skill.entity';
import { Category } from 'src/categories/entities/category.entity';
import { RequestRefreshToken, RequestWithUser } from './auth.types';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [AuthService],
    }).compile();

    controller = module.get(AuthController);
    authService = jest.mocked(module.get(AuthService));

    authService.getRefreshTokenExpiresIn.mockReturnValue('7d');
  });

  describe('POST /auth/register', () => {
    it('should call authService.register with DTO and return RegisterResponseDto', async () => {
      const dto = {
        email: 'test@example.com',
        password: 'secret123',
        role: UserRole.USER as const,
        name: 'Test User',
        birthdate: '1990-01-01',
        city: 'Moscow',
        gender: UserGender.MALE,
      };

      const mockUserEntity = {
        id: 'user-123',
        email: dto.email,
        name: dto.name,
        about: undefined,
        avatar: undefined,
        city: dto.city,
        gender: dto.gender,
        role: dto.role,
        birthdate: new Date(dto.birthdate),
        skills: [] as Skill[],
        wantToLearn: [] as Category[],
        favoriteSkills: [] as Skill[],
        password: 'hashed-password',
      };

      const mockResponseDto: RegisterResponseDto = {
        id: mockUserEntity.id,
        name: mockUserEntity.name,
        email: mockUserEntity.email,
        about: mockUserEntity.about,
        birthdate: mockUserEntity.birthdate,
        city: mockUserEntity.city,
        gender: mockUserEntity.gender,
        avatar: mockUserEntity.avatar,
        skills: mockUserEntity.skills.map((s) => s.id),
        wantToLearn: mockUserEntity.wantToLearn.map((c) => c.id),
        favoriteSkills: mockUserEntity.favoriteSkills.map((s) => s.id),
        role: mockUserEntity.role,
      };

      authService.register.mockResolvedValue(mockUserEntity);

      const result = await controller.register(dto);

      expect(() => authService.register(dto)).toHaveBeenCalled();
      expect(result).toEqual(mockResponseDto);
    });
  });

  describe('POST /auth/login', () => {
    it('should set refreshToken cookie and return response without refreshToken in body', async () => {
      const dto: LoginDto = {
        email: 'test@example.com',
        password: 'secret123',
      };

      const mockServiceResult: LoginServiceResponseDto = {
        success: true,
        user: {
          id: 'user-123',
          name: 'Test User',
          email: dto.email,
          about: undefined,
          birthdate: new Date('1990-01-01'),
          city: 'Moscow',
          gender: UserGender.MALE,
          avatar: undefined,
          skills: [] as Skill[],
          wantToLearn: [] as Category[],
          favoriteSkills: [] as Skill[],
          role: UserRole.USER,
        },
        accessToken: 'access-token',
        refreshToken: 'refresh-token-from-service',
      };

      authService.login.mockResolvedValue(mockServiceResult);

      const response: Partial<Response> & Response = {
        cookie: jest.fn(),
      } as unknown as Response;

      const result = await controller.login(dto, response);

      expect(() => authService.login(dto)).toHaveBeenCalled();

      expect(() =>
        response.cookie('refresh_token', mockServiceResult.refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: ms('7d'),
        }),
      ).toHaveBeenCalled();

      expect(result).toEqual({
        success: mockServiceResult.success,
        user: mockServiceResult.user,
        accessToken: mockServiceResult.accessToken,
      });
    });
  });

  describe('POST /auth/logout', () => {
    it('should call logout with userId from req.user.sub', async () => {
      const req: RequestWithUser = {
        user: {
          sub: 'user-123',
          email: 'test@example.com',
          role: UserRole.USER,
        },
      } as unknown as RequestWithUser;

      await controller.logout(req);

      expect(() => authService.logout('user-123')).toHaveBeenCalled();
    });
  });

  describe('POST /auth/refresh', () => {
    it('should call refresh with refreshToken from req.user and return new tokens', async () => {
      const req: RequestRefreshToken = {
        user: {
          sub: 'user-123',
          email: 'test@example.com',
          refreshToken: 'old-token',
        },
      } as unknown as RequestRefreshToken;

      const mockResult = {
        accessToken: 'new-access',
        refreshToken: 'new-refresh',
      };

      authService.refresh.mockResolvedValue(mockResult);

      const result = await controller.refresh(req);

      expect(() =>
        authService.refresh(req.user.refreshToken),
      ).toHaveBeenCalled();
      expect(result).toEqual(mockResult);
    });
  });
});
