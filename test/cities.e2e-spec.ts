import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { City } from '../src/cities/entities/city.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtAuthGuard } from '../src/auth/guards/jwt.guard';
import { RolesGuard } from '../src/auth/guards/roles.guard';

// --- Интерфейсы для тестов
interface CityResponse {
  id: string;
  name: string;
  district?: string;
  population?: number;
  lat?: number;
  lon?: number;
}

interface ErrorResponse {
  statusCode: number;
  message: string | string[];
  timestamp: string;
  path: string;
}
// --------------------------

describe('CitiesController (E2E)', () => {
  let app: INestApplication;
  let httpRequest: ReturnType<typeof request>;
  let cityRepository: Repository<City>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
      providers: [
        {
          provide: JwtAuthGuard,
          useValue: { canActivate: () => true },
        },
        {
          provide: RolesGuard,
          useValue: { canActivate: () => true },
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    httpRequest = request(app.getHttpServer());
    cityRepository = app.get(getRepositoryToken(City));
  });

  beforeEach(async () => {
    await cityRepository.clear();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /cities', () => {
    it('should create a city with valid data', async () => {
      const payload = {
        name: 'TestCity',
        lat: 55.7558,
        lon: 37.6176,
        district: 'Central',
        population: 1200000,
        subject: 'Moscow Oblast',
      };

      const res = await httpRequest.post('/cities').send(payload);

      expect(res.status).toBe(201);
      expect(res.body as CityResponse).toHaveProperty('id');
      expect((res.body as CityResponse).name).toBe('TestCity');
      expect((res.body as CityResponse).district).toBe('Central');
    });

    it('should reject city creation with name too short', async () => {
      const payload = { name: 'A' };
      const res = await httpRequest.post('/cities').send(payload);
      expect(res.status).toBe(400);
    });

    it('should reject city creation with invalid lat/lon types', async () => {
      const payload = {
        name: 'BadCoords',
        lat: 'not-a-number',
        lon: 'also-not-a-number',
      };
      const res = await httpRequest.post('/cities').send(payload);
      expect(res.status).toBe(400);
    });

    it('should reject duplicate city name (unique constraint)', async () => {
      const payload = { name: 'DuplicateCity' };
      await httpRequest.post('/cities').send(payload);
      const res = await httpRequest.post('/cities').send(payload);

      expect(res.status).toBe(409);
      const message = (res.body as ErrorResponse).message;
      expect(
        typeof message === 'string' ? message : message.join(' '),
      ).toContain('already exists');
    });
  });

  describe('GET /cities', () => {
    it('should list all cities', async () => {
      await httpRequest.post('/cities').send({ name: 'City1', district: 'D1' });
      await httpRequest.post('/cities').send({ name: 'City2', district: 'D2' });

      const res = await httpRequest.get('/cities');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);

      const cities = res.body as CityResponse[];
      expect(cities.length).toBe(2);
    });

    it('should search cities by name (partial match)', async () => {
      await httpRequest.post('/cities').send({ name: 'Moscow' });
      await httpRequest.post('/cities').send({ name: 'Moscovy' });

      const res = await httpRequest.get('/cities').query({ name: 'Mos' });
      expect(res.status).toBe(200);

      const names = (res.body as CityResponse[]).map((c) => c.name);
      expect(names).toContain('Moscow');
      expect(names).toContain('Moscovy');
    });

    it('should filter by district and subject', async () => {
      await httpRequest.post('/cities').send({
        name: 'CityA',
        district: 'North',
        subject: 'Region1',
      });
      await httpRequest.post('/cities').send({
        name: 'CityB',
        district: 'South',
        subject: 'Region2',
      });

      const res = await httpRequest
        .get('/cities')
        .query({ district: 'North', subject: 'Region1' });

      expect(res.status).toBe(200);
      const cities = res.body as CityResponse[];
      expect(cities.length).toBe(1);
      expect(cities[0].name).toBe('CityA');
    });
  });

  describe('GET /cities/:id', () => {
    it('should return a single city by ID', async () => {
      const createRes = await httpRequest
        .post('/cities')
        .send({ name: 'SingleCity' });
      const id = (createRes.body as CityResponse).id;

      const res = await httpRequest.get(`/cities/${id}`);
      expect(res.status).toBe(200);
      expect((res.body as CityResponse).name).toBe('SingleCity');
    });

    it('should return 404 for non-existent city', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';
      const res = await httpRequest.get(`/cities/${nonExistentId}`);
      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /cities/:id', () => {
    it('should update city fields', async () => {
      const createRes = await httpRequest
        .post('/cities')
        .send({ name: 'OldName', population: 100 });
      const id = (createRes.body as CityResponse).id;

      const updatePayload = { population: 200, district: 'NewDistrict' };
      const res = await httpRequest.patch(`/cities/${id}`).send(updatePayload);

      expect(res.status).toBe(200);
      expect((res.body as CityResponse).population).toBe(200);
      expect((res.body as CityResponse).district).toBe('NewDistrict');
    });

    it('should not change fields that are not provided', async () => {
      const createRes = await httpRequest
        .post('/cities')
        .send({ name: 'KeepName', lat: 1.23, lon: 4.56 });
      const id = (createRes.body as CityResponse).id;

      const res = await httpRequest
        .patch(`/cities/${id}`)
        .send({ population: 999 });

      expect(res.status).toBe(200);
      const city = res.body as CityResponse;
      expect(city.name).toBe('KeepName');
      expect(city.lat).toBeCloseTo(1.23);
      expect(city.lon).toBeCloseTo(4.56);
      expect(city.population).toBe(999);
    });

    it('should reject update if new name conflicts with existing city', async () => {
      const _city1Res = await httpRequest
        .post('/cities')
        .send({ name: 'ExistingCity' });
      const city2Res = await httpRequest
        .post('/cities')
        .send({ name: 'AnotherCity' });

      const id = (city2Res.body as CityResponse).id;
      const res = await httpRequest
        .patch(`/cities/${id}`)
        .send({ name: 'ExistingCity' });

      expect(res.status).toBe(409);
      const message = (res.body as ErrorResponse).message;
      expect(typeof message === 'string' ? message : message.join(' ')).toBe(
        'City name conflict or unique constraint violation',
      );
    });
  });

  describe('DELETE /cities/:id', () => {
    it('should delete a city', async () => {
      const createRes = await httpRequest
        .post('/cities')
        .send({ name: 'ToDelete' });
      const id = (createRes.body as CityResponse).id;

      const res = await httpRequest.delete(`/cities/${id}`);
      expect(res.status).toBe(200);

      const getRes = await httpRequest.get(`/cities/${id}`);
      expect(getRes.status).toBe(404);
    });

    it('should return 404 when deleting non-existent city', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';
      const res = await httpRequest.delete(`/cities/${nonExistentId}`);
      expect(res.status).toBe(404);
    });
  });
});
