import { DataSource } from 'typeorm';
import { User } from '../users/entities/user.entity';
import * as bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
import { UserGender, UserRole } from '../users/enums/users.enums';
import { dbConfig } from '../config/db.config';
import { Skill } from 'src/skills/entities/skill.entity';
import { Category } from 'src/categories/entities/category.entity';

dotenv.config();

const dataSource = new DataSource({
  ...dbConfig(),
  entities: [User, Skill, Category],
});

async function seedAdmin() {
  await dataSource.initialize();

  const userRepo = dataSource.getRepository(User);

  const adminEmail = process.env.ADMIN_EMAIL || 'admin@skillswap.ru';
  const adminPassword = process.env.ADMIN_PASSWORD || 'AdminSuper2024!';

  const existing = await userRepo.findOne({
    where: { email: adminEmail },
  });

  if (existing) {
    console.log(`  ↻ ${adminEmail} — администратор уже существует, пропускаю`);
  } else {
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    const admin = userRepo.create({
      name: 'Администратор',
      email: adminEmail,
      password: hashedPassword,
      about: 'Главный администратор платформы SkillSwap.',
      birthdate: new Date('1990-01-01'),
      city: 'Москва',
      gender: UserGender.MALE,
      role: UserRole.ADMIN,
      wantToLearn: [],
    });

    await userRepo.save(admin);
    console.log(`  ✓ ${adminEmail} — администратор создан`);
  }

  await dataSource.destroy();
}

seedAdmin().catch((err) => {
  console.error('Ошибка при сидинге администратора:', err);
  process.exit(1);
});
