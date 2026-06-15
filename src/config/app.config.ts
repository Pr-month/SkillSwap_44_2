import { registerAs } from '@nestjs/config';
import { ConfigType } from '@nestjs/config';

export const appConfig = registerAs('app', () => ({
  port: Number(process.env.PORT) || 3000,
  hashSalt: process.env.HASH_SALT || 'default_salt_please_change',
}));

export type AppConfig = ConfigType<typeof appConfig>;