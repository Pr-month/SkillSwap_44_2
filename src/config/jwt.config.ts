import { ConfigType, registerAs } from '@nestjs/config';
import ms from 'ms';

// Конфиг JWT: секреты и TTL для access/refresh токенов; значения из env (с дефолтами), ms — для формата времени ('15m', '7d')
export const jwtConfig = registerAs('JWT_CONFIG', () => ({
  accessSecret: process.env.JWT_ACCESS_SECRET ?? 'your_access_secret_key',
  accessExpiresIn: (process.env.JWT_ACCESS_EXPIRES_IN ??
    '15m') as ms.StringValue,
  refreshSecret: process.env.JWT_REFRESH_SECRET ?? 'your_refresh_secret_key',
  refreshExpiresIn: (process.env.JWT_REFRESH_EXPIRES_IN ??
    '7d') as ms.StringValue,
}));

// Типизированный конфиг для безопасного использования в сервисах/модулях
export type TJwtConfig = ConfigType<typeof jwtConfig>;

