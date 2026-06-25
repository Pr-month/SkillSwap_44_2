import { forwardRef, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { User } from '../users/entities/user.entity';
import bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';
import { jwtConfig, TJwtConfig } from 'src/config/jwt.config';
import { LoginServiceResponseDto } from './dto/login-service-response.dto';
import { JwtPayload } from './auth.types';

@Injectable()
export class AuthService {
  constructor(
    @Inject(jwtConfig.KEY)
    private readonly jwtConf: TJwtConfig,
    @Inject(forwardRef(() => UsersService))
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  private async generateAccessToken(user: User): Promise<string> {
    return this.jwtService.signAsync(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
      },
      {
        secret: this.jwtConf.accessSecret,
        expiresIn: this.jwtConf.accessExpiresIn,
      },
    );
  }

  private async generateRefreshToken(userId: string): Promise<string> {
    return this.jwtService.signAsync(
      { sub: userId },
      {
        secret: this.jwtConf.refreshSecret,
        expiresIn: this.jwtConf.refreshExpiresIn,
      },
    );
  }

  getRefreshTokenExpiresIn() {
    return this.jwtConf.refreshExpiresIn;
  }

  // Публичный метод для хеширования пароля (используется в UsersService)
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  // Публичный метод для сравнения пароля (используется в UsersService и login)
  async comparePasswords(plainPassword: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hash);
  }

  async register(createUserDto: CreateUserDto): Promise<User> {
    const password = await this.hashPassword(createUserDto.password);


    const toCreate: CreateUserDto = {
      ...createUserDto,
      password,
    };

    return this.usersService.create(toCreate);
  }

  async login(loginDto: LoginDto): Promise<LoginServiceResponseDto> {
    const user = await this.usersService.findByEmail(loginDto.email);

    if (!user || !(await bcrypt.compare(loginDto.password, user.password))) {
      throw new UnauthorizedException('Неверные учётные данные');
    }

    const [accessToken, refreshToken] = await Promise.all([
      this.generateAccessToken(user),
      this.generateRefreshToken(user.id),
    ]);

    await this.usersService.update(user.id, { refreshToken });

    const {
      password: _password,
      refreshToken: _refreshToken,
      ...userWithoutSensitiveData
    } = user;

    return {
      success: true,
      user: userWithoutSensitiveData,
      accessToken,
      refreshToken,
    };
  }

  public async logout(id: string) {
    return this.usersService.update(id, { refreshToken: null });
  }

  async refresh(refreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(
        refreshToken,
        {
          secret: this.jwtConf.refreshSecret,
        },
      );

      const user = await this.usersService.findOne(payload.sub);

      if (user.refreshToken !== refreshToken) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const [accessToken, newRefreshToken] = await Promise.all([
        this.generateAccessToken(user),
        this.generateRefreshToken(user.id),
      ]);

      await this.usersService.update(user.id, {
        refreshToken: newRefreshToken,
      });

      return {
        accessToken,
        refreshToken: newRefreshToken,
      };
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
}
