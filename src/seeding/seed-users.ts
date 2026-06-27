import { DataSource } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Skill } from '../skills/entities/skill.entity';
import * as bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
import { seedUsers } from './data/users.data';
import { UserGender, UserRole } from '../users/enums/users.enums';

dotenv.config();

async function seedUsersFn() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'admin',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'skill_swap',
    entities: [User, Skill],
    synchronize: true,
  });

  await dataSource.initialize();

  const userRepo = dataSource.getRepository(User);

  console.log('Начало сидинга пользователей...');

  for (const userData of seedUsers) {
    const existing = await userRepo.findOne({
      where: { email: userData.email },
    });

    if (existing) {
      console.log(`  ↻ ${userData.email} — уже существует, пропускаю`);
      continue;
    }

    const hashedPassword = await bcrypt.hash(userData.password, 10);

    const user = userRepo.create({
      name: userData.name,
      email: userData.email,
      password: hashedPassword,
      about: userData.about,
      birthdate: userData.birthdate,
      city: userData.city,
      gender: userData.gender,
      role: userData.role,
      wantToLearn: userData.wantToLearn,
    });

    await userRepo.save(user);
    console.log(`  ✓ ${userData.email} (${userData.name})`);
  }

  // --- Создание администратора из env ---
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@skillswap.ru';
  const adminPassword = process.env.ADMIN_PASSWORD || 'AdminSuper2024!';
  const adminName = 'Администратор';

  const existingAdmin = await userRepo.findOne({
    where: { email: adminEmail },
  });

  if (existingAdmin) {
    console.log(`  ↻ ${adminEmail} — администратор уже существует, пропускаю`);
  } else {
    const hashedAdminPassword = await bcrypt.hash(adminPassword, 10);

    const admin = userRepo.create({
      name: adminName,
      email: adminEmail,
      password: hashedAdminPassword,
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
  // -------------------------------------

  const total = await userRepo.count();
  console.log(`\nСидинг завершён. Всего пользователей: ${total}`);

  await dataSource.destroy();
}

seedUsersFn().catch((err) => {
  console.error('Ошибка при сидинге пользователей:', err);
  process.exit(1);
});
