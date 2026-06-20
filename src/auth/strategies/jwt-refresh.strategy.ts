import { Injectable, Inject, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { Request } from 'express';
import { jwtConfig, TJwtConfig } from '../../config/jwt.config';
import { JwtPayload } from '../auth.types';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(
    @Inject(jwtConfig.KEY)
    private readonly jwtConfig: TJwtConfig,
  ) {
    super({
      jwtFromRequest: (req: Request) => {
        const cookies = req.cookies as { refresh_token?: string };
        return cookies?.refresh_token ?? null;
      },
      secretOrKey: jwtConfig.refreshSecret,
      ignoreExpiration: false,
      passReqToCallback: true,
    });
  }

  validate(
    req: Request,
    payload: JwtPayload,
  ): JwtPayload & { refreshToken: string } {
    const cookies = req.cookies as { refresh_token?: string };
    const refreshToken = cookies?.refresh_token;
    if (!refreshToken) throw new UnauthorizedException();
    return {
      sub: payload.sub,
      email: payload.email,
      role: payload.role,
      refreshToken,
    };
  }
}