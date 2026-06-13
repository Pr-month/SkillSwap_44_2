export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
}

export interface JwtPayload {
  sub: number;
  email: string;
  role: UserRole;
}