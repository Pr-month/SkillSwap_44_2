import { DataSource } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Category } from '../categories/entities/category.entity';
import * as bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
import { seedUsers } from './data/users.data';
import { dbConfig } from '../config/db.config';
import { Skill } from '../skills/entities/skill.entity';

dotenv.config();

export async function seedUsersFn() {
  const dataSource = new DataSource({
    ...dbConfig(),
    entities: [User, Skill, Category],
  });

  await dataSource.initialize();

  const userRepo = dataSource.getRepository(User);
  const categoryRepo = dataSource.getRepository(Category);

  console.log('Начало сидинга тестовых пользователей...');

  const allCategories = await categoryRepo.find();
  const categoryMap = new Map<string, Category>();
  for (const cat of allCategories) {
    categoryMap.set(cat.name, cat);
  }

  for (const userData of seedUsers) {
    const existing = await userRepo.findOne({
      where: { email: userData.email },
    });

    if (existing) {
      console.log(`  ↻ ${userData.email} — уже существует, пропускаю`);
      continue;
    }

    const hashedPassword = await bcrypt.hash(userData.password, 10);

    const resolvedCategories = userData.wantToLearn
      .map((name) => categoryMap.get(name))
      .filter((c): c is Category => c !== undefined);

    const user = userRepo.create({
      name: userData.name,
      email: userData.email,
      password: hashedPassword,
      about: userData.about,
      birthdate: userData.birthdate,
      city: userData.city,
      gender: userData.gender,
      role: userData.role,
      wantToLearn: resolvedCategories,
    });

    await userRepo.save(user);
    console.log(`  ✓ ${userData.email} (${userData.name})`);
  }

  const total = await userRepo.count();
  console.log(`\nСидинг завершён. Всего пользователей: ${total}`);

  await dataSource.destroy();
}

if (require.main === module) {
  seedUsersFn().catch((err) => {
    console.error('Ошибка при сидинге пользователей:', err);
    process.exit(1);
  });
}
