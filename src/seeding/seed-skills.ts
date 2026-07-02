import { User } from 'src/users/entities/user.entity';
import { Category } from 'src/categories/entities/category.entity';
import { Skill } from 'src/skills/entities/skill.entity';
import { CategoriesData } from './data/category.data';
import { seedUsers } from './data/users.data';
import * as bcrypt from 'bcryptjs';
import { seedSkillsData } from './data/skills.data';
import { DataSource } from 'typeorm';
import { dbConfig } from 'src/config/db.config';

async function seedSkills() {
  const dataSource = new DataSource({
    ...dbConfig(),
    entities: [Category, User, Skill],
  });

  await dataSource.initialize();
  await dataSource.synchronize(true);

  const userRepo = dataSource.getRepository(User);
  const categoryRepo = dataSource.getRepository(Category);
  const skillRepo = dataSource.getRepository(Skill);

  const userCount = await userRepo.count();
  const categoryCount = await categoryRepo.count();
  const skillCount = await skillRepo.count();

  if (userCount > 0) {
    return;
  }

  if (categoryCount > 0) {
    return;
  }

  if (skillCount > 0) {
    return;
  }
  // создание категорий
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
  // для поиска
  const allCategories = await categoryRepo.find();

  // создание пользователей
  for (const userData of seedUsers) {
    const hashedPassword = await bcrypt.hash(userData.password, 10);

    const resolvedCategories: Category[] = [];
    for (const name of userData.wantToLearn) {
      const cat = allCategories.find((c) => c.name === name);
      if (cat) resolvedCategories.push(cat);
    }

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
  }
  // для поиска
  const allUsers = await userRepo.find();

  //создание навыков

  for (const entry of seedSkillsData) {
    const user = allUsers.find((u) => u.email === entry.userEmail);
    if (!user) {
      continue;
    }

    for (const skillInfo of entry.skills) {
      const category = allCategories.find(
        (c) => c.name === skillInfo.categoryName,
      );
      if (!category) {
        continue;
      }

      const skill = skillRepo.create({
        title: skillInfo.title,
        description: skillInfo.description,
        images: skillInfo.images || [],
        owner: user,
        categoryId: category.id,
      });
      await skillRepo.save(skill);
    }
  }
}

seedSkills().catch((err) => {
  console.error(err);
  process.exit(1);
})
