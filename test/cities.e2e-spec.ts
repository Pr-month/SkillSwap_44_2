import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { City } from '../src/cities/entities/city.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../src/users/entities/user.entity';

interface CityResponse {
  id: string;
  name: string;
  district?: string;
  population?: number;
  lat?: number;
  lon?: number;
}

// interface ErrorResponse {
//   statusCode: number;
//   message: string | string[];
//   timestamp: string;
//   path: string;
// }

interface LoginResponseDto {
  success: boolean;
  user: Partial<User>;
  accessToken: string;
  refreshToken: string;
}

describe('CitiesController', () => {
  let app: INestApplication;
  let httpRequest: ReturnType<typeof request>;
  let cityRepository: Repository<City>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    httpRequest = request(app.getHttpServer());
    cityRepository = app.get(getRepositoryToken(City));

    const adminRegisterRes = await httpRequest.post('/auth/register').send({
      email: 'admin@test.com',
      password: 'password123',
      role: 'admin',
    });
    expect(adminRegisterRes.status).toBe(201);

    const userRegisterRes = await httpRequest.post('/auth/register').send({
      email: 'user@test.com',
      password: 'password123',
      role: 'user',
    });
    expect(userRegisterRes.status).toBe(201);
  });

  beforeEach(async () => {
    await cityRepository.clear();
  });

  afterAll(async () => {
    await app.close();
  });

  // Вспомогательная функция для получения токена админа внутри теста
  async function getAdminToken(): Promise<string> {
    const res = await httpRequest
      .post('/auth/login')
      .send({ email: 'admin@test.com', password: 'password123' });
    expect(res.status).toBe(200);
    return (res.body as LoginResponseDto).accessToken;
  }

  // Вспомогательная функция для получения токена юзера внутри теста
  async function getUserToken(): Promise<string> {
    const res = await httpRequest
      .post('/auth/login')
      .send({ email: 'user@test.com', password: 'password123' });
    expect(res.status).toBe(200);
    return (res.body as LoginResponseDto).accessToken;
  }

  describe('POST /cities', () => {
    it('should create a city with valid data (authorized as admin)', async () => {
      const token = await getAdminToken();

      const payload = {
        name: 'TestCity',
        lat: 55.7558,
        lon: 37.6176,
        district: 'Central',
        population: 1200000,
        subject: 'Moscow Oblast',
      };

      const res = await httpRequest
        .set('Authorization', `Bearer ${token}`)
        .post('/cities')
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body as CityResponse).toHaveProperty('id');
      expect((res.body as CityResponse).name).toBe('TestCity');
    });

    it('should reject unauthorized POST /cities (no token)', async () => {
      const payload = { name: 'UnauthorizedCity' };
      const res = await httpRequest.post('/cities').send(payload);

      expect(res.status).toBe(401);
    });

    it('should reject POST /cities for non-admin user (role check)', async () => {
      const token = await getUserToken();

      const payload = { name: 'ForbiddenCity' };
      const res = await httpRequest
        .set('Authorization', `Bearer ${token}`)
        .post('/cities')
        .send(payload);

      expect(res.status).toBe(403);
    });

    it('should reject city creation with name too short', async () => {
      const token = await getAdminToken();
      const payload = { name: 'A' };

      const res = await httpRequest
        .set('Authorization', `Bearer ${token}`)
        .post('/cities')
        .send(payload);

      expect(res.status).toBe(400);
    });
  });

  describe('GET /cities', () => {
    it('should list all cities (no auth required)', async () => {
      const adminToken = await getAdminToken();
      await httpRequest
        .set('Authorization', `Bearer ${adminToken}`)
        .post('/cities')
        .send({ name: 'City1' });

      const res = await httpRequest.get('/cities');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect((res.body as CityResponse[]).length).toBe(1);
    });

    it('should allow listing cities for non-admin user', async () => {
      const adminToken = await getAdminToken();
      await httpRequest
        .set('Authorization', `Bearer ${adminToken}`)
        .post('/cities')
        .send({ name: 'VisibleCity' });

      const userToken = await getUserToken();
      const res = await httpRequest
        .set('Authorization', `Bearer ${userToken}`)
        .get('/cities');

      expect(res.status).toBe(200);
      expect((res.body as CityResponse[]).length).toBe(1);
    });
  });

  describe('PATCH /cities/:id', () => {
    it('should update city fields (admin)', async () => {
      const token = await getAdminToken();
      const createRes = await httpRequest
        .set('Authorization', `Bearer ${token}`)
        .post('/cities')
        .send({ name: 'OldName', population: 100 });

      const id = (createRes.body as CityResponse).id;
      const updatePayload = { population: 200 };

      const res = await httpRequest
        .set('Authorization', `Bearer ${token}`)
        .patch(`/cities/${id}`)
        .send(updatePayload);

      expect(res.status).toBe(200);
      expect((res.body as CityResponse).population).toBe(200);
    });

    it('should reject PATCH for non-admin user (403)', async () => {
      const adminToken = await getAdminToken();
      const createRes = await httpRequest
        .set('Authorization', `Bearer ${adminToken}`)
        .post('/cities')
        .send({ name: 'ProtectedCity' });

      const id = (createRes.body as CityResponse).id;

      const userToken = await getUserToken();
      const res = await httpRequest
        .set('Authorization', `Bearer ${userToken}`)
        .patch(`/cities/${id}`)
        .send({ population: 999 });

      expect(res.status).toBe(403);
    });
  });

  describe('DELETE /cities/:id', () => {
    it('should delete a city (admin)', async () => {
      const token = await getAdminToken();
      const createRes = await httpRequest
        .set('Authorization', `Bearer ${token}`)
        .post('/cities')
        .send({ name: 'ToDelete' });

      const id = (createRes.body as CityResponse).id;

      const res = await httpRequest
        .set('Authorization', `Bearer ${token}`)
        .delete(`/cities/${id}`);

      expect(res.status).toBe(200);

      const getRes = await httpRequest.get(`/cities/${id}`);
      expect(getRes.status).toBe(404);
    });

    it('should reject DELETE for non-admin user (403)', async () => {
      const adminToken = await getAdminToken();
      const createRes = await httpRequest
        .set('Authorization', `Bearer ${adminToken}`)
        .post('/cities')
        .send({ name: 'ProtectedDelete' });

      const id = (createRes.body as CityResponse).id;
      const userToken = await getUserToken();

      const res = await httpRequest
        .set('Authorization', `Bearer ${userToken}`)
        .delete(`/cities/${id}`);

      expect(res.status).toBe(403);
    });
  });
});
