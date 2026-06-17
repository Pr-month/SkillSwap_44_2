import {
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { User } from '../users/entities/user.entity';
import bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { LoginDto } from './dto/login.dto';
import { TJwtConfig } from 'src/config/jwt.config';
import { LoginServiceResponseDto } from './dto/login-service-response.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  private getJwtConfig(): TJwtConfig {
    const jwtConfig = this.configService.get<TJwtConfig>('JWT_CONFIG');
    if (!jwtConfig) {
      throw new InternalServerErrorException(
        'JWT_CONFIG не найден в конфигурации',
      );
    }
    return jwtConfig;
  }

  private async generateAccessToken(user: User): Promise<string> {
    const jwtConfig = this.getJwtConfig();
    return this.jwtService.signAsync(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
      },
      {
        secret: jwtConfig.accessSecret,
        expiresIn: jwtConfig.accessExpiresIn,
      },
    );
  }

  private async generateRefreshToken(userId: string): Promise<string> {
    const jwtConfig = this.getJwtConfig();
    return this.jwtService.signAsync(
      { sub: userId },
      {
        secret: jwtConfig.refreshSecret,
        expiresIn: jwtConfig.refreshExpiresIn,
      },
    );
  }

  getRefreshTokenExpiresIn() {
    const jwtConfig = this.getJwtConfig();
    return jwtConfig.refreshExpiresIn;
  }

  async register(createUserDto: CreateUserDto): Promise<User> {
    const password = await bcrypt.hash(createUserDto.password, 10);

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
}
