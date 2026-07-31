/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import request from 'supertest';

interface LoginResponseDto {
  success: boolean;
  user: Partial<{ email: string; id: string }>;
  accessToken: string;
  refreshToken: string;
}

interface UserResponse {
  id: string;
  name: string;
  email: string;
  about?: string;
  birthdate: Date | string;
  city: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  avatar?: string;
  skills?: unknown[];
  wantToLearn?: unknown[];
  favoriteSkills?: unknown[];
  role: 'USER' | 'ADMIN';
}

interface PasswordChangeSuccessResponse {
  message: string;
}

interface ErrorResponse {
  message?: string;
  statusCode?: number;
  error?: string;
}

describe('UsersController (E2E)', () => {
  let app: INestApplication;
  let mariaToken: string;
  let ivanToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
    );
    await app.init();

    const login = async (email: string, pass: string): Promise<string> => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email, password: pass });
      expect(res.status).toBe(200);
      return (res.body as LoginResponseDto).accessToken;
    };

    mariaToken = await login('maria@skillswap.ru', 'MariaDev2024!');
    ivanToken = await login('ivan@skillswap.ru', 'IvanLead#85');
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /users', () => {
    it('should list all users (requires auth)', async () => {
      const res = await request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${mariaToken}`);

      expect(res.status).toBe(200);
      const body = res.body as UserResponse[];
      expect(Array.isArray(body)).toBe(true);
      expect(body.length).toBeGreaterThanOrEqual(1);
    });

    it('should reject GET /users without token', async () => {
      const res = await request(app.getHttpServer()).get('/users');
      expect(res.status).toBe(401);
    });
  });

  describe('GET /users/me', () => {
    it('should return current user profile for authorized user (Maria)', async () => {
      const res = await request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', `Bearer ${mariaToken}`);

      expect(res.status).toBe(200);
      const body = res.body as UserResponse;
      expect(body.email).toBe('maria@skillswap.ru');
      expect(body.name).toBeDefined();
      expect(res.body).not.toHaveProperty('password');
    });

    it('should return current user profile for authorized user (Ivan)', async () => {
      const res = await request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', `Bearer ${ivanToken}`);

      expect(res.status).toBe(200);
      const body = res.body as UserResponse;
      expect(body.email).toBe('ivan@skillswap.ru');
    });

    it('should reject GET /users/me without token', async () => {
      const res = await request(app.getHttpServer()).get('/users/me');
      expect(res.status).toBe(401);
    });
  });

  describe('GET /users/:id', () => {
    let testUserId: string;

    beforeEach(async () => {
      const payload = {
        name: `Temp User ${Date.now()}`,
        email: `temp-${Date.now()}@test.com`,
        password: 'TempPass123!',
        birthdate: '1995-05-20',
        city: 'Saint Petersburg',
        gender: 'OTHER' as const,
      };
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send(payload);
      expect(res.status).toBe(201);
      testUserId = (res.body as UserResponse).id;
    });

    it('should return user by ID for authorized user', async () => {
      const res = await request(app.getHttpServer())
        .get(`/users/${testUserId}`)
        .set('Authorization', `Bearer ${mariaToken}`);

      expect(res.status).toBe(200);
      const body = res.body as UserResponse;
      expect(body.id).toBe(testUserId);
    });

    it('should reject GET /users/:id with invalid UUID', async () => {
      const res = await request(app.getHttpServer())
        .get('/users/not-a-valid-uuid')
        .set('Authorization', `Bearer ${mariaToken}`);
      expect(res.status).toBe(400);
    });

    it('should return 404 for non-existent user ID', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const res = await request(app.getHttpServer())
        .get(`/users/${fakeId}`)
        .set('Authorization', `Bearer ${mariaToken}`);
      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /users/me', () => {
    it('should update current user profile', async () => {
      const payload = {
        name: 'Updated Name',
        city: 'New City',
        about: 'Updated about text',
        birthdate: '1985-03-10',
      };

      const res = await request(app.getHttpServer())
        .patch('/users/me')
        .set('Authorization', `Bearer ${ivanToken}`)
        .send(payload);

      expect(res.status).toBe(200);
      const body = res.body as UserResponse;
      expect(body.name).toBe(payload.name);
      expect(body.city).toBe(payload.city);
      expect(body.about).toBe(payload.about);
    });

    it('should allow partial update (only provided fields)', async () => {
      const payload = { city: 'Only City Updated' };

      const res = await request(app.getHttpServer())
        .patch('/users/me')
        .set('Authorization', `Bearer ${mariaToken}`)
        .send(payload);

      expect(res.status).toBe(200);
      const body = res.body as UserResponse;
      expect(body.city).toBe(payload.city);
    });

    it('should reject PATCH /users/me without token', async () => {
      const res = await request(app.getHttpServer())
        .patch('/users/me')
        .send({ city: 'Any' });
      expect(res.status).toBe(401);
    });
  });

  describe('PATCH /users/me/password', () => {
    let testUserToken: string;
    const initialPassword = 'OldPassword123!';
    const newValidPassword = 'NewStrongPass456!';

    beforeEach(async () => {
      const uniqueEmail = `test-${Date.now()}@skillswap.ru`;

      const registerRes = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: `Test User ${Date.now()}`,
          email: uniqueEmail,
          password: initialPassword,
          birthdate: '1990-01-01',
          city: 'Moscow',
          gender: 'MALE' as const,
        });
      expect(registerRes.status).toBe(201);

      const loginRes = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: uniqueEmail, password: initialPassword });
      expect(loginRes.status).toBe(200);

      testUserToken = (loginRes.body as LoginResponseDto).accessToken;
    });

    it('should successfully change password with correct old password', async () => {
      const payload = {
        oldPassword: initialPassword,
        newPassword: newValidPassword,
      };

      const res = await request(app.getHttpServer())
        .patch('/users/me/password')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send(payload);

      expect(res.status).toBe(200);
      expect((res.body as PasswordChangeSuccessResponse).message).toBe(
        'Password successfully changed',
      );
    });

    it('should reject password change with incorrect old password', async () => {
      const payload = {
        oldPassword: 'WrongPassword999',
        newPassword: newValidPassword,
      };

      const res = await request(app.getHttpServer())
        .patch('/users/me/password')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send(payload);

      expect(res.status).toBe(403);
      const errorBody = res.body as ErrorResponse;
      expect(errorBody.message).toBe('Old password is incorrect');
    });

    it('should reject password change when new password equals old password', async () => {
      const payload = {
        oldPassword: initialPassword,
        newPassword: initialPassword,
      };

      const res = await request(app.getHttpServer())
        .patch('/users/me/password')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send(payload);

      expect(res.status).toBe(400);
      const errorBody = res.body as ErrorResponse;
      expect(errorBody.message).toBe(
        'New password cannot be the same as the old one',
      );
    });

    it('should enforce password validation rules for new password', async () => {
      const payload = {
        oldPassword: initialPassword,
        newPassword: 'weak',
      };

      const res = await request(app.getHttpServer())
        .patch('/users/me/password')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send(payload);

      expect(res.status).toBe(400);
    });

    it('should reject password change without token', async () => {
      const payload = {
        oldPassword: initialPassword,
        newPassword: newValidPassword,
      };

      const res = await request(app.getHttpServer())
        .patch('/users/me/password')
        .send(payload);

      expect(res.status).toBe(401);
    });

    it('should reject password change with invalid/expired token', async () => {
      const payload = {
        oldPassword: initialPassword,
        newPassword: newValidPassword,
      };

      const res = await request(app.getHttpServer())
        .patch('/users/me/password')
        .set('Authorization', 'Bearer invalid_token_123')
        .send(payload);

      expect(res.status).toBe(401);
    });
  });
});
