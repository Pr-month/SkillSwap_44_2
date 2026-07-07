import { DataSource } from 'typeorm';
import { Category } from '../categories/entities/category.entity';
import { CategoriesData } from './data/category.data';
import * as dotenv from 'dotenv';
import { dbConfig } from '../config/db.config';
dotenv.config();

async function seedCategories() {
  const dataSource = new DataSource({
    ...dbConfig(),
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