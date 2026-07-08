// src/seeding/seed-all.ts
import { DataSource } from 'typeorm';
import { Category } from '../categories/entities/category.entity';
import { User } from '../users/entities/user.entity';
import { Skill } from '../skills/entities/skill.entity';
import * as dotenv from 'dotenv';
import { dbConfig } from '../config/db.config';
import { seedCategories } from './seed-categories';
import { seedUsersFn } from './seed-users';
import { seedAdmin } from './seed-admin';
import { seedSkills } from './seed-skills';
import { seedCitiesFn } from './seed-cities';

dotenv.config();

type TableRow = { table_name: string };

export async function seedAll(): Promise<void> {
  const ds = new DataSource({
    ...dbConfig(),
    entities: [Category, User, Skill],
  });

  await ds.initialize();

  const rows = await ds.query<TableRow[]>(
    "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE' ORDER BY table_name",
  );
  const existing = new Set(rows.map((r: TableRow) => r.table_name));

  const order: string[] = [
    'users_favorite_skills_skills',
    'users_want_to_learn_categories',
    'cities',
    'skills',
    'requests',
    'users',
    'categories',
  ];
  for (const tbl of order) {
    if (existing.has(tbl)) {
      await ds.query<void>('TRUNCATE TABLE "' + tbl + '" CASCADE');
    }
  }

  await ds.destroy();

  console.log('--- Seeding categories ---');
  await seedCategories();
  console.log('--- Seeding cities ---');
  await seedCitiesFn();
  console.log('--- Seeding users ---');
  await seedUsersFn();
  console.log('--- Seeding admin ---');
  await seedAdmin();
  console.log('--- Seeding skills ---');
  await seedSkills();
}

if (require.main === module) {
  seedAll()
    .then((): void => {
      console.log('Seed all complete.');
      process.exit(0);
    })
    .catch((err: unknown): void => {
      console.error('Seed all failed:', err);
      process.exit(1);
    });
}
