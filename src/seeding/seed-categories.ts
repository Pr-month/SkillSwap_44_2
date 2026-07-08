import { DataSource } from 'typeorm';
import { Category } from '../categories/entities/category.entity';
import { User } from '../users/entities/user.entity';
import { Skill } from '../skills/entities/skill.entity';
import { CategoriesData } from './data/category.data';
import * as dotenv from 'dotenv';
import { dbConfig } from '../config/db.config';
dotenv.config();

export async function seedCategories() {
  const dataSource = new DataSource({
    ...dbConfig(),
    entities: [Category, User, Skill],
  });

  await dataSource.initialize();

  const categoryRepo = dataSource.getRepository(Category);

  // Очищаем таблицу (опционально)
  await dataSource.query('TRUNCATE TABLE "categories" CASCADE');

  for (const parentData of CategoriesData) {
    const parent = categoryRepo.create({
      name: parentData.name,
    });
    await categoryRepo.save(parent);

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

if (require.main === module) {
  seedCategories().catch((error) => {
    console.error('Seeding failed:', error);
    process.exit(1);
  });
}
