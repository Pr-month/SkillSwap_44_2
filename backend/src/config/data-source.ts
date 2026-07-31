import { DataSource } from 'typeorm';
import { City } from '../cities/entities/city.entity';

import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({
  path:
    process.env.NODE_ENV === 'test'
      ? path.resolve(process.cwd(), '.env.test.local')
      : path.resolve(process.cwd(), '.env'),
});

export const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'admin',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'skill_swap',
  entities: [City],
  migrations: ['src/database/migrations/*.{ts,js}'],
  synchronize: false,
});
