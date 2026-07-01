// src/seeding/seed-categories.ts
import { DataSource } from 'typeorm';
import { Category } from '../categories/entities/category.entity';
import { CategoriesData } from './data/category.data';
import * as dotenv from 'dotenv';
dotenv.config();

async function seedCategories() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'admin',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'skill_swap',
    entities: [Category],
  });

  await dataSource.initialize();

  const categoryRepo = dataSource.getRepository(Category);

  // Очищаем таблицу (опционально)
  await categoryRepo.clear();

  for (const parentData of CategoriesData) {
    // Создаём родительскую категорию
    const parent = categoryRepo.create({
      name: parentData.name,
    });
    await categoryRepo.save(parent);

    // Создаём дочерние
    for (const childName of parentData.children) {
      const child = categoryRepo.create({
        name: childName,
        parent: parent,
      });
      await categoryRepo.save(child);
    }
  }

  console.log('Categories seeded successfully!');
  await dataSource.destroy();
}

seedCategories().catch((error) => {
  console.error('Seeding failed:', error);
  process.exit(1);
});