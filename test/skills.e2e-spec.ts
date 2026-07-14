/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { Skill } from '../src/skills/entities/skill.entity';
import { User } from '../src/users/entities/user.entity';
import { Category } from '../src/categories/entities/category.entity';

interface LoginResponseDto {
  success: boolean;
  user: Partial<{ email: string; id: string }>;
  accessToken: string;
  refreshToken: string;
}

interface SkillResponse {
  id: string;
  title: string;
  description?: string;
  images?: string[];
  owner: { id: string };
  category?: { id: string };
}

interface PaginatedSkillsResponse {
  data: SkillResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

describe('SkillsController (E2E)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
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

    dataSource = moduleFixture.get(DataSource);

    const login = async (email: string, pass: string): Promise<string> => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email, password: pass });
      expect(res.status).toBe(200);
      return (res.body as LoginResponseDto).accessToken;
    };

    // adminToken не используется в тестах — просто логинимся
    await login('admin@skillswap.ru', 'AdminSuper2024!');
    mariaToken = await login('maria@skillswap.ru', 'MariaDev2024!');
    ivanToken = await login('ivan@skillswap.ru', 'IvanLead#85');
  });

  afterAll(async () => {
    await app.close();
  });

async function ensureCategoryExists(name: string): Promise<string> {
  const repo = dataSource.getRepository(Category);
  const normalizedName = name.trim();
  let category = await repo.findOne({ where: { name: normalizedName } }) as Category | null;
  if (!category) {
    category = await repo.save({ name: normalizedName });
  }
  return category.id;
}

  async function createTestSkill(
    ownerEmail: string,
    title: string,
    categoryName: string = 'Backend',
  ): Promise<SkillResponse> {
    const userRepo = dataSource.getRepository(User);
    const skillRepo = dataSource.getRepository(Skill);
    const categoryId = await ensureCategoryExists(categoryName);

    const owner = await userRepo.findOne({
      where: { email: ownerEmail },
    }) as User | null;

    if (!owner) throw new Error(`User ${ownerEmail} not found`);

    let skill = await skillRepo.findOne({
      where: {
        owner: { id: owner.id },
        title,
        category: { id: categoryId },
      },
      relations: ['owner', 'category'],
    }) as Skill | null;

    if (!skill) {
      skill = await skillRepo.save({
        title,
        description: `[TEST] ${title}`,
        images: [`/uploads/test-${Date.now()}.png`],
        owner,
        category: { id: categoryId } as any,
      });
    }

    return {
      id: skill.id,
      title: skill.title,
      description: skill.description,
      images: skill.images,
      owner: { id: skill.owner.id },
      category: skill.category ? { id: skill.category.id } : undefined,
    };
  }

  describe('POST /skills', () => {
    it('should create a skill with valid data (authorized user)', async () => {
      const payload = {
        title: 'Игра на гитаре',
        description: 'Научу базовым аккордам',
        images: ['/uploads/guitar-1.png'],
      };

      const res = await request(app.getHttpServer())
        .post('/skills')
        .set('Authorization', `Bearer ${mariaToken}`)
        .send(payload);

      expect(res.status).toBe(201);
      const body = res.body as SkillResponse;
      expect(body.id).toBeDefined();
      expect(body.title).toBe('Игра на гитаре');
      expect(body.owner.id).toBeDefined();
    });

    it('should reject POST /skills without token (401)', async () => {
      const payload = { title: 'UnauthorizedSkill' };
      const res = await request(app.getHttpServer()).post('/skills').send(payload);
      expect(res.status).toBe(401);
    });

    it('should reject skill creation with title too short (validation)', async () => {
      const payload = { title: 'A' };
      const res = await request(app.getHttpServer())
        .post('/skills')
        .set('Authorization', `Bearer ${mariaToken}`)
        .send(payload);
      expect(res.status).toBe(400);
    });
  });

  describe('GET /skills', () => {
    it('should list skills with pagination', async () => {
      await createTestSkill('maria@skillswap.ru', 'Node.js Basics');
      await createTestSkill('ivan@skillswap.ru', 'React Fundamentals');

      const res = await request(app.getHttpServer())
        .get('/skills?page=1&limit=10')
        .set('Authorization', `Bearer ${ivanToken}`);

      expect(res.status).toBe(200);
      const body = res.body as PaginatedSkillsResponse;
      expect(body).toHaveProperty('data');
      expect(body).toHaveProperty('total');
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.total).toBeGreaterThanOrEqual(2);
    });

    it('should work without auth (public endpoint)', async () => {
      const res = await request(app.getHttpServer()).get('/skills');
      expect(res.status).toBe(200);
      const body = res.body as PaginatedSkillsResponse;
      expect(body).toHaveProperty('data');
    });
  });

  describe('GET /skills/:id', () => {
    let skill: SkillResponse;

    beforeEach(async () => {
      skill = await createTestSkill('maria@skillswap.ru', 'TypeScript Pro');
    });

    it('should return skill by ID', async () => {
      const res = await request(app.getHttpServer())
        .get(`/skills/${skill.id}`)
        .set('Authorization', `Bearer ${ivanToken}`);
      expect(res.status).toBe(200);
      const body = res.body as SkillResponse;
      expect(body.id).toBe(skill.id);
      expect(body.title).toBe('TypeScript Pro');
    });

    it('should return 400 for non-existent skill', async () => {
      // ВАЖНО: этот тест будет падать, пока контроллер не валидирует UUID до запроса к БД.
      // См. рекомендации ниже по исправлению контроллера.
      const res = await request(app.getHttpServer())
        .get('/skills/non-existent-uuid')
        .set('Authorization', `Bearer ${mariaToken}`);
      expect(res.status).toBe(400);
    });
  });

  describe('PATCH /skills/:id', () => {
    let skill: SkillResponse;

    beforeEach(async () => {
      skill = await createTestSkill('maria@skillswap.ru', 'Original Title');
    });

    it('should update skill (owner only)', async () => {
      const payload = {
        title: 'Updated Title',
        description: 'New description',
      };

      const res = await request(app.getHttpServer())
        .patch(`/skills/${skill.id}`)
        .set('Authorization', `Bearer ${mariaToken}`)
        .send(payload);

      expect(res.status).toBe(200);
      const body = res.body as SkillResponse;
      expect(body.title).toBe('Updated Title');
      expect(body.description).toBe('New description');
    });

    it('should reject update by non-owner (403)', async () => {
      const payload = { title: 'Forbidden Update' };

      const res = await request(app.getHttpServer())
        .patch(`/skills/${skill.id}`)
        .set('Authorization', `Bearer ${ivanToken}`)
        .send(payload);

      expect(res.status).toBe(403);
    });

    it('should allow partial update via UpdateSkillDto', async () => {
      const payload = { description: 'Only description updated' };

      const res = await request(app.getHttpServer())
        .patch(`/skills/${skill.id}`)
        .set('Authorization', `Bearer ${mariaToken}`)
        .send(payload);

      expect(res.status).toBe(200);
      const body = res.body as SkillResponse;
      expect(body.description).toBe('Only description updated');
      expect(body.title).toBe('Original Title');
    });
  });

  describe('DELETE /skills/:id', () => {
    let skill: SkillResponse;

    beforeEach(async () => {
      skill = await createTestSkill('maria@skillswap.ru', 'ToDelete');
    });

    it('should delete skill (owner only)', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/skills/${skill.id}`)
        .set('Authorization', `Bearer ${mariaToken}`);

      expect(res.status).toBe(200);

      const getRes = await request(app.getHttpServer())
        .get(`/skills/${skill.id}`)
        .set('Authorization', `Bearer ${ivanToken}`);
      expect(getRes.status).toBe(404);
    });

    it('should reject delete by non-owner (403)', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/skills/${skill.id}`)
        .set('Authorization', `Bearer ${ivanToken}`);
      expect(res.status).toBe(403);
    });
  });

  describe('POST /skills/:id/favorite', () => {
    let skill: SkillResponse;

    beforeEach(async () => {
      skill = await createTestSkill('ivan@skillswap.ru', 'FavoriteTarget');
    });

    it('should add skill to favorites (authorized user)', async () => {
      const res = await request(app.getHttpServer())
        .post(`/skills/${skill.id}/favorite`)
        .set('Authorization', `Bearer ${mariaToken}`);

      // Если твой API реально возвращает 201 при создании — оставь 201
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('message');
    });

    it('should reject duplicate favorite (ConflictException)', async () => {
      await request(app.getHttpServer())
        .post(`/skills/${skill.id}/favorite`)
        .set('Authorization', `Bearer ${mariaToken}`);

      const res = await request(app.getHttpServer())
        .post(`/skills/${skill.id}/favorite`)
        .set('Authorization', `Bearer ${mariaToken}`);

      expect(res.status).toBe(409);
    });

    it('should require auth to add to favorites', async () => {
      const res = await request(app.getHttpServer()).post(
        `/skills/${skill.id}/favorite`,
      );
      expect(res.status).toBe(401);
    });
  });

  describe('DELETE /skills/:id/favorite', () => {
    let skill: SkillResponse;

    beforeEach(async () => {
      skill = await createTestSkill('ivan@skillswap.ru', 'UnfavoriteTarget');
      const addRes = await request(app.getHttpServer())
        .post(`/skills/${skill.id}/favorite`)
        .set('Authorization', `Bearer ${mariaToken}`);
      expect(addRes.status).toBe(201);
    });

    it('should remove skill from favorites', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/skills/${skill.id}/favorite`)
        .set('Authorization', `Bearer ${mariaToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('message');
    });

    it('should reject removing non-existing favorite', async () => {
      // Сначала удаляем
      const delRes = await request(app.getHttpServer())
        .delete(`/skills/${skill.id}/favorite`)
        .set('Authorization', `Bearer ${mariaToken}`);
      expect(delRes.status).toBe(200);

      // Потом пытаемся удалить второй раз
      const secondDelRes = await request(app.getHttpServer())
        .delete(`/skills/${skill.id}/favorite`)
        .set('Authorization', `Bearer ${mariaToken}`);

      // Тут зависит от твоей реализации: либо 404 (нет избранного), либо 409 (дубль).
      // Чаще всего для «удалить несуществующее» делают 404.
      expect([404, 409]).toContain(secondDelRes.status);
    });
  });

  describe('GET /skills/:id/similar', () => {
    let skillWithCategory: SkillResponse;

    beforeEach(async () => {
      skillWithCategory = await createTestSkill(
        'maria@skillswap.ru',
        'SimilarTest',
        'Frontend',
      );
    });

    it('should return similar skills by category', async () => {
      await createTestSkill(
        'ivan@skillswap.ru',
        'Another Frontend Skill',
        'Frontend',
      );

      const res = await request(app.getHttpServer())
        .get(`/skills/${skillWithCategory.id}/similar`)
        .set('Authorization', `Bearer ${ivanToken}`);

      expect(res.status).toBe(200);
      const body = res.body as SkillResponse[];
      expect(Array.isArray(body)).toBe(true);
      expect(body.length).toBeGreaterThanOrEqual(1);
    });

    it('should return empty array if no similar skills', async () => {
      const uniqueSkill = await createTestSkill(
        'maria@skillswap.ru',
        'UniqueCategorySkill',
        'RareCategory',
      );

      const res = await request(app.getHttpServer())
        .get(`/skills/${uniqueSkill.id}/similar`)
        .set('Authorization', `Bearer ${ivanToken}`);

      expect(res.status).toBe(200);
      const body = res.body as SkillResponse[];
      expect(Array.isArray(body)).toBe(true);
      expect(body.length).toBe(0);
    });

    it('should be accessible without owner auth (public similar skills)', async () => {
      const res = await request(app.getHttpServer()).get(
        `/skills/${skillWithCategory.id}/similar`,
      );

      expect(res.status).toBe(200);
      const body = res.body as SkillResponse[];
      expect(Array.isArray(body)).toBe(true);
    });
  });
});
