import { User } from '../users/entities/user.entity';
import { Category } from '../categories/entities/category.entity';
import { Skill } from '../skills/entities/skill.entity';
import { CategoriesData } from './data/category.data';
import { seedUsers } from './data/users.data';
import * as bcrypt from 'bcryptjs';
import { seedSkillsData } from './data/skills.data';
import { DataSource } from 'typeorm';
import { dbConfig } from '../config/db.config';

async function seedSkills() {
  const dataSource = new DataSource({
    ...dbConfig(),
    entities: [Category, User, Skill],
  });

  await dataSource.initialize();

  const userRepo = dataSource.getRepository(User);
  const categoryRepo = dataSource.getRepository(Category);
  const skillRepo = dataSource.getRepository(Skill);

  const userCount = await userRepo.count();
  const categoryCount = await categoryRepo.count();

  if (userCount === 0) {
    console.error('Пользователей нет, нужно запустить seed:users');
    await dataSource.destroy();
    process.exit(1);
  }

  if (categoryCount === 0) {
    console.error('Категорий нет, нужно запустить seed:categories');
    await dataSource.destroy();
    process.exit(1);
  }

  const categories = await categoryRepo.find();
  const users = await userRepo.find();

  for (const userSkills of seedSkillsData) {
    const user = users.find((u) => u.email === userSkills.userEmail);
    if (!user) {
      continue;
    }
    for (const skillData of userSkills.skills) {
      const category = categories.find(
        (c) => c.name === skillData.categoryName,
      );
      if (!category) {
        continue;
      }

      const foundSkill = await skillRepo.findOne({
        where: {
          owner: { id: user.id },
          title: skillData.title,
          categoryId: category.id,
        },
      });

      if (foundSkill) {
        continue;
      }

      const newSkill = skillRepo.create({
        title: skillData.title,
        description: skillData.description,
        images: skillData.images || [],
        owner: user,
        categoryId: category.id,
      });
      await skillRepo.save(newSkill);
    }
  }

  await dataSource.destroy();
}

seedSkills().catch((err) => {
  console.error(err);
  process.exit(1);
});
