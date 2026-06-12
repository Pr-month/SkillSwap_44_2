import { registerAs } from '@nestjs/config';

export interface IAppConfig {
  port: number;
  hashSalt: string;
}

export const appConfig = registerAs('app', (): IAppConfig => ({
  port: Number(process.env.PORT) || 3000,
  hashSalt: process.env.HASH_SALT || 'default_salt_please_change',
}));