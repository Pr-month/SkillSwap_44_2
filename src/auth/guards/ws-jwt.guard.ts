import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { TJwtConfig } from '../../config/jwt.config';
import { jwtConfig } from '../../config/jwt.config';
import { JwtPayload } from '../auth.types';

@Injectable()
export class WsJwtGuard {
  constructor(
    private readonly jwtService: JwtService,
    @Inject(jwtConfig.KEY)
    private readonly jwtConf: TJwtConfig,
  ) {}

  async verify(token?: string): Promise<JwtPayload> {
    if (!token) {
      throw new UnauthorizedException('Missing JWT token in query');
    }

    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: this.jwtConf.accessSecret,
      });
      return payload;
    } catch {
      throw new UnauthorizedException('Invalid or expired JWT token');
    }
  }
}
