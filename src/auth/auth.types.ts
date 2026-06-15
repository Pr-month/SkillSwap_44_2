import { UserRole } from '../users/enums/users.enums';

export interface JwtPayload {
  sub: number;
  email: string;
  role: UserRole;
}
