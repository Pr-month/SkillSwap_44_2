import {
  INestApplication,
  ValidationPipe,
  ClassSerializerInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { App } from 'supertest/types';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { User } from '../src/users/entities/user.entity';
import { UserGender } from '../src/users/enums/users.enums';
import { AllExceptionsFilter } from '../src/common/all-exception.filter';

interface RegisterResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
  };
}

interface LoginResponse {
  accessToken: string;
}

describe('Auth (E2E)', () => {
  let app: INestApplication<App>;
  let httpRequest: ReturnType<typeof request>;
  let dataSource: DataSource;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule, TypeOrmModule.forFeature([User])],
    }).compile();

    app = moduleFixture.createNestApplication();
    dataSource = moduleFixture.get(DataSource);

    // ГЛОБАЛЬНЫЕ КОМПОНЕНТЫ
    // 1. Валидация DTO (whitelist, transform, forbidNonWhitelisted)
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    // 2. Сериализация (скрытие полей, например password)
    app.useGlobalInterceptors(
      new ClassSerializerInterceptor(app.get(Reflector)),
    );

    // 3. Обработка ошибок через фильтр
    app.useGlobalFilters(new AllExceptionsFilter());

    await app.init();

    httpRequest = request(app.getHttpServer());
  });

  afterAll(async () => {
    await app.close();
  });

  const clearDb = async () => {
    // Таблица "users" из @Entity('users') в user.entity.ts
    await dataSource.query('TRUNCATE TABLE "users" RESTART IDENTITY CASCADE');
  };

  beforeEach(async () => {
    // Очищаем БД перед КАЖДЫМ тестом
    await clearDb();
  });

  describe('Registration & Login', () => {
    it('should register user and return tokens', async () => {
      const registerDto = {
        name: 'E2E User',
        email: 'e2e@example.com',
        password: 'strongPassword123',
        birthdate: '1990-01-01',
        city: 'Moscow',
        gender: UserGender.MALE,
      };

      const res = await httpRequest
        .post('/auth/register')
        .send(registerDto)
        .expect(201);

      const data = res.body as RegisterResponse;

      expect(data).toHaveProperty('accessToken');
      expect(data).toHaveProperty('refreshToken');
      expect(data.user).toHaveProperty('id');

      const userRepo = dataSource.getRepository(User);
      const user = await userRepo.findOne({
        where: { email: registerDto.email },
      });

      expect(user).toBeDefined();
      expect(user!.password).not.toBe(registerDto.password);
      expect(user!.gender).toBe(UserGender.MALE);
    });

    it('should login and set refreshToken cookie', async () => {
      await httpRequest
        .post('/auth/register')
        .send({
          name: 'Login Test',
          email: 'login-test@example.com',
          password: 'password123',
          birthdate: '1995-01-01',
          city: 'Kazan',
          gender: UserGender.FEMALE,
        })
        .expect(201);

      const loginDto = {
        email: 'login-test@example.com',
        password: 'password123',
      };
      const res = await httpRequest
        .post('/auth/login')
        .send(loginDto)
        .expect(200);

      const data = res.body as LoginResponse;
      expect(data).toHaveProperty('accessToken');

      // Безопасная проверка куки
      const setCookieHeader = res.headers['set-cookie'];
      expect(setCookieHeader).toBeDefined();

      const cookies = Array.isArray(setCookieHeader)
        ? setCookieHeader
        : [setCookieHeader];
      expect(
        cookies.some((cookie: string) => cookie.startsWith('refreshToken=')),
      ).toBe(true);
    });

    it('should reject invalid credentials', async () => {
      await httpRequest
        .post('/auth/login')
        .send({ email: 'nonexistent@example.com', password: 'wrong-password' })
        .expect(401);
    });
  });
});
