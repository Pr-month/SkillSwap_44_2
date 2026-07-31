import type { Request } from 'express';
import { UserRole } from '../users/enums/users.enums';

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
}

export interface JwtPayloadRefreshToken extends JwtPayload {
  refreshToken: string;
}

export interface RequestRefreshToken extends JwtPayload {
  user: JwtPayloadRefreshToken;
}

export interface RequestWithUser extends Request {
  user: JwtPayload;
}
