import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

interface JwtPayload {
  id: string;
}
@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

  private async generateTokens(id: string) {
    const payload: JwtPayload = { id };

    return {
      accessToken: await this.jwtService.signAsync(payload, {
        expiresIn: '15m',
      }),
      refreshToken: await this.jwtService.signAsync(payload, {
        expiresIn: '7d',
      }),
    };
  }

  private async updateRefreshToken(id: string, refreshToken: string) {
    // TODO: сохранить токен в репозитории пользователя
    await Promise.resolve();
    return `this method updates ${refreshToken} refresh token of ${id} user`;
  }

  async refresh(refreshToken: string) {
    try {
      const payload =
        await this.jwtService.verifyAsync<JwtPayload>(refreshToken);

      const tokens = await this.generateTokens(payload.id);

      await this.updateRefreshToken(payload.id, tokens.refreshToken);

      return tokens;
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
}
