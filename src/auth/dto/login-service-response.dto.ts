import { LoginResponseDto } from './login-response.dto';

export interface LoginServiceResponseDto extends Omit<
  LoginResponseDto,
  'refreshToken'
> {
  refreshToken: string;
}
