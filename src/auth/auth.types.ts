import { UserRole } from '../users/enums/users.enums';

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
}
