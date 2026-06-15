import { registerAs } from '@nestjs/config';
import { DataSourceOptions } from 'typeorm';

export const dbConfig = registerAs(
  'database',
  (): DataSourceOptions => ({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 5432,
    username: process.env.DB_USERNAME || 'admin',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'skill_swap',
    entities: [__dirname + '/**/*.entity{.ts,.js}'],
    synchronize: process.env.NODE_ENV !== 'production',
  }),
);

export type TDbConfig = ReturnType<typeof dbConfig>;
