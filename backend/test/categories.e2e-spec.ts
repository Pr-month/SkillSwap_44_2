import { Test, TestingModule } from '@nestjs/testing';
import {
  INestApplication,
  ValidationPipe,
  ClassSerializerInterceptor,
} from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { Reflector } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { AllExceptionsFilter } from '../src/common/all-exception.filter';
import { CategoriesData } from '../src/seeding/data/category.data';

interface LoginResponse {
  accessToken: string;
}

interface CategoryItem {
  id: string;
  name: string;
  parentId: string | null;
  children: CategoryItem[];
}

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'admin@skillswap.ru';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? 'AdminSuper2024!';

const USER_EMAIL = 'maria@skillswap.ru';
const USER_PASSWORD = 'MariaDev2024!';

const NON_EXISTENT_UUID = '00000000-0000-0000-0000-000000000000';

describe('CategoriesController (e2e)', () => {
  let app: INestApplication<App>;
  let adminToken: string;
  let userToken: string;

  let seededRootCategoryId: string;
  let createdCategoryId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.useGlobalInterceptors(
      new ClassSerializerInterceptor(app.get(Reflector)),
    );
    app.useGlobalFilters(new AllExceptionsFilter());

    await app.init();

    const adminLoginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD });
    const adminLoginBody = adminLoginRes.body as LoginResponse;
    adminToken = adminLoginBody.accessToken;

    const userLoginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: USER_EMAIL, password: USER_PASSWORD });
    const userLoginBody = userLoginRes.body as LoginResponse;
    userToken = userLoginBody.accessToken;

    const categoriesRes = await request(app.getHttpServer()).get('/categories');
    const categoriesBody = categoriesRes.body as CategoryItem[];

    seededRootCategoryId = categoriesBody[0]?.id ?? '';
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /categories', () => {
    it('200 — returns all root categories, each with a children array', async () => {
      const response = await request(app.getHttpServer())
        .get('/categories')
        .expect(200);

      const body = response.body as CategoryItem[];

      expect(Array.isArray(body)).toBe(true);
      expect(body.length).toBeGreaterThanOrEqual(CategoriesData.length);

      const category = body[0];
      expect(category).toHaveProperty('id');
      expect(category).toHaveProperty('name');
      expect(Array.isArray(category.children)).toBe(true);
      expect(category.parentId).toBeNull();

      const returnedNames = new Set(body.map((c) => c.name));
      for (const expected of CategoriesData) {
        expect(returnedNames).toContain(expected.name);
      }
    });
  });

  describe('GET /categories/:id', () => {
    it('200 — returns a category with its children and parent relations', async () => {
      const response = await request(app.getHttpServer())
        .get(`/categories/${seededRootCategoryId}`)
        .expect(200);

      const body = response.body as CategoryItem;

      expect(body.id).toBe(seededRootCategoryId);
      expect(typeof body.name).toBe('string');
      expect(Array.isArray(body.children)).toBe(true);
      expect(body.children.length).toBeGreaterThan(0);
    });

    it('404 — returns 404 for a non-existent UUID', async () => {
      await request(app.getHttpServer())
        .get(`/categories/${NON_EXISTENT_UUID}`)
        .expect(404);
    });
  });

  describe('POST /categories', () => {
    it('401 — returns 401 when no auth token is provided', async () => {
      await request(app.getHttpServer())
        .post('/categories')
        .send({ name: 'Без токена' })
        .expect(401);
    });

    it('403 — returns 403 for a non-admin (regular user) token', async () => {
      await request(app.getHttpServer())
        .post('/categories')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ name: 'Не-админ' })
        .expect(403);
    });

    it('400 — returns 400 when name is too short (< 2 chars)', async () => {
      await request(app.getHttpServer())
        .post('/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'А' })
        .expect(400);
    });

    it('400 — returns 400 when body contains unknown fields (forbidNonWhitelisted)', async () => {
      await request(app.getHttpServer())
        .post('/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Валидное имя', unknownField: 'запрещено' })
        .expect(400);
    });

    it('201 — admin creates a root category', async () => {
      const response = await request(app.getHttpServer())
        .post('/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'E2E: Тестовая категория' })
        .expect(201);

      const body = response.body as CategoryItem;

      expect(body).toMatchObject({
        name: 'E2E: Тестовая категория',
      });
      expect(body.parentId ?? null).toBeNull();

      createdCategoryId = body.id;
    });

    it('201 — admin creates a child category under the root category', async () => {
      const response = await request(app.getHttpServer())
        .post('/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'E2E: Тестовая подкатегория',
          parentId: createdCategoryId,
        })
        .expect(201);

      const body = response.body as CategoryItem;

      expect(body).toMatchObject({
        name: 'E2E: Тестовая подкатегория',
        parentId: createdCategoryId,
      });
    });

    it('409 — returns 409 when the category name already exists (unique constraint)', async () => {
      await request(app.getHttpServer())
        .post('/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'E2E: Тестовая категория' })
        .expect(409);
    });
  });

  describe('PATCH /categories/:id', () => {
    it('401 — returns 401 when no auth token is provided', async () => {
      await request(app.getHttpServer())
        .patch(`/categories/${createdCategoryId}`)
        .send({ name: 'Без токена' })
        .expect(401);
    });

    it('403 — returns 403 for a non-admin (regular user) token', async () => {
      await request(app.getHttpServer())
        .patch(`/categories/${createdCategoryId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ name: 'Не-админ' })
        .expect(403);
    });

    it('404 — returns 404 for a non-existent UUID', async () => {
      await request(app.getHttpServer())
        .patch(`/categories/${NON_EXISTENT_UUID}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Обновление' })
        .expect(404);
    });

    it('409 — returns 409 when trying to set category as its own parent', async () => {
      await request(app.getHttpServer())
        .patch(`/categories/${createdCategoryId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ parentId: createdCategoryId })
        .expect(409);
    });

    it('200 — admin updates the category name', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/categories/${createdCategoryId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'E2E: Обновлённая категория' })
        .expect(200);

      const body = response.body as CategoryItem;

      expect(body).toMatchObject({
        id: createdCategoryId,
        name: 'E2E: Обновлённая категория',
      });
    });
  });

  describe('DELETE /categories/:id', () => {
    it('401 — returns 401 when no auth token is provided', async () => {
      await request(app.getHttpServer())
        .delete(`/categories/${createdCategoryId}`)
        .expect(401);
    });

    it('403 — returns 403 for a non-admin (regular user) token', async () => {
      await request(app.getHttpServer())
        .delete(`/categories/${createdCategoryId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });

    it('409 — returns 409 when deleting a category that still has children', async () => {
      await request(app.getHttpServer())
        .delete(`/categories/${createdCategoryId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(409);
    });

    it('404 — returns 404 for a non-existent UUID', async () => {
      await request(app.getHttpServer())
        .delete(`/categories/${NON_EXISTENT_UUID}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('200 — admin deletes a leaf (child) category', async () => {
      const categoryResponse = await request(app.getHttpServer())
        .get(`/categories/${createdCategoryId}`)
        .expect(200);

      const body = categoryResponse.body as CategoryItem;
      const child = body.children[0];

      if (!child) {
        throw new Error('Expected at least one child category');
      }

      const childItem = child;
      const childId = childItem.id;

      expect(childId).toBeDefined();

      await request(app.getHttpServer())
        .delete(`/categories/${childId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });

    it('200 — admin deletes the parent category after all its children are removed', async () => {
      await request(app.getHttpServer())
        .delete(`/categories/${createdCategoryId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      await request(app.getHttpServer())
        .get(`/categories/${createdCategoryId}`)
        .expect(404);
    });
  });
});
