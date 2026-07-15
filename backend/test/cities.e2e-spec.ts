/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../src/app.module';

import request from 'supertest';

interface CityResponse {
  id: string;
  name: string;
  district?: string;
  population?: number;
  lat?: number;
  lon?: number;
}

interface LoginResponseDto {
  success: boolean;
  user: Partial<{ email: string }>;
  accessToken: string;
  refreshToken: string;
}

describe('CitiesController (E2E)', () => {
  let app: INestApplication;
  let adminToken: string;
  let userToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
    );
    await app.init();

    // Логиним админа
    const loginResAdmin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'admin@skillswap.ru', password: 'AdminSuper2024!' });

    expect(loginResAdmin.status).toBe(200);
    adminToken = (loginResAdmin.body as LoginResponseDto).accessToken;

    // Логиним обычного юзера
    const loginResUser = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'maria@skillswap.ru', password: 'MariaDev2024!' });

    expect(loginResUser.status).toBe(200);
    userToken = (loginResUser.body as LoginResponseDto).accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /cities', () => {
    it('should create a city with valid data (authorized as admin)', async () => {
      const payload = {
        name: 'TestCity',
        lat: 55.7558,
        lon: 37.6176,
        district: 'Central',
        population: 1200000,
        subject: 'Moscow Oblast',
      };

      const res = await request(app.getHttpServer())
        .post('/cities')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body as CityResponse).toHaveProperty('id');
      expect((res.body as CityResponse).name).toBe('TestCity');
    });

    it('should reject unauthorized POST /cities (no token)', async () => {
      const payload = { name: 'UnauthorizedCity' };
      const res = await request(app.getHttpServer())
        .post('/cities')
        .send(payload);

      expect(res.status).toBe(401);
    });

    it('should reject POST /cities for non-admin user (role check)', async () => {
      const payload = { name: 'ForbiddenCity' };

      const res = await request(app.getHttpServer())
        .post('/cities')
        .set('Authorization', `Bearer ${userToken}`)
        .send(payload);

      expect(res.status).toBe(403);
    });

    it('should reject city creation with name too short', async () => {
      const payload = { name: 'A' };

      const res = await request(app.getHttpServer())
        .post('/cities')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(payload);

      expect(res.status).toBe(400);
    });
  });

  describe('GET /cities', () => {
    it('should list all cities (no auth required)', async () => {
      await request(app.getHttpServer())
        .post('/cities')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'City1' });

      const res = await request(app.getHttpServer()).get('/cities');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect((res.body as CityResponse[]).length).toBeGreaterThanOrEqual(1);
    });

    it('should allow listing cities for non-admin user', async () => {
      await request(app.getHttpServer())
        .post('/cities')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'VisibleCity' });

      const res = await request(app.getHttpServer())
        .get('/cities')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect((res.body as CityResponse[]).length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('PATCH /cities/:id', () => {
    let cityId: string;

    beforeEach(async () => {
      const res = await request(app.getHttpServer())
        .post('/cities')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'PatchTestCity', population: 100 });
      cityId = (res.body as CityResponse).id;
    });

    it('should update city fields (admin)', async () => {
      const updatePayload = { population: 200 };

      const res = await request(app.getHttpServer())
        .patch(`/cities/${cityId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updatePayload);

      expect(res.status).toBe(200);
      expect((res.body as CityResponse).population).toBe(200);
    });

    it('should reject PATCH for non-admin user (403)', async () => {
      const updatePayload = { population: 999 };

      const res = await request(app.getHttpServer())
        .patch(`/cities/${cityId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(updatePayload);

      expect(res.status).toBe(403);
    });
  });

  describe('DELETE /cities/:id', () => {
    let cityId: string;

    beforeEach(async () => {
      const res = await request(app.getHttpServer())
        .post('/cities')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'DeleteTestCity' });
      cityId = (res.body as CityResponse).id;
    });

    it('should delete a city (admin)', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/cities')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'DeleteTestCity' });

      const cityId = (createRes.body as CityResponse).id;
      expect(cityId).toBeDefined();

      const deleteRes = await request(app.getHttpServer())
        .delete(`/cities/${cityId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(deleteRes.status).toBe(200);

      const listRes = await request(app.getHttpServer()).get('/cities');
      expect(listRes.status).toBe(200);

      const cities = listRes.body as CityResponse[];
      const exists = cities.some((c) => c.id === cityId);
      expect(exists).toBe(false);
    });

    it('should reject DELETE for non-admin user (403)', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/cities/${cityId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(403);
    });
  });
});
