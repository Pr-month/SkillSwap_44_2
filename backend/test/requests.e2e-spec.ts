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

interface RequestResponse {
  id: string;
  createdAt: Date;
  status: 'pending' | 'accepted' | 'rejected' | 'inProgress' | 'done';
  isRead: boolean;
  sender: { id: string };
  receiver: { id: string };
  offeredSkill: { id: string; title: string };
  requestedSkill: { id: string; title: string };
}

describe('RequestsController (E2E)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let adminToken: string;
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

    const login = async (email: string, pass: string) => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email, password: pass });
      
      // Не делаем expect здесь, чтобы увидеть реальный ответ в логах при ошибке
      if (res.status !== 200) {
        throw new Error(`Login failed for ${email}. Status: ${res.status}, Body: ${JSON.stringify(res.body)}`);
      }
      
      return (res.body as LoginResponseDto).accessToken;
    };

    // Теперь эти логины должны работать, так как БД чистая, но сидинг (который ты запускаешь отдельно) уже создал пользователей
    adminToken = await login('admin@skillswap.ru', 'AdminSuper2024!');
    mariaToken = await login('maria@skillswap.ru', 'MariaDev2024!');
    ivanToken = await login('ivan@skillswap.ru', 'IvanLead#85');
  });

  afterAll(async () => {
    await app.close();
  });

  // 👇 2. ДИАГНОСТИЧЕСКИЙ ТЕСТ ПЕРВЫМ
  it('should successfully login admin (diagnostic)', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'admin@skillswap.ru', password: 'AdminSuper2024!' });
    
    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeDefined();
  });

  async function ensureSkillExists(
    ownerEmail: string,
    title: string,
    categoryName: string = 'Backend',
  ): Promise<string> {
    const userRepo = dataSource.getRepository(User);
    const skillRepo = dataSource.getRepository(Skill);
    const categoryRepo = dataSource.getRepository(Category);

    const owner = await userRepo.findOne({ where: { email: ownerEmail } });
    if (!owner) throw new Error(`User ${ownerEmail} not found. Check seed script.`);

    // 👇 3. НЕ СОЗДАЁМ КАТЕГОРИИ ЗДЕСЬ
    // Если категории нет, тест должен упасть и сказать "добавь это в seed", а не создавать сам.
    let category = await categoryRepo.findOne({
      where: { name: categoryName },
    });
    
    if (!category) {
      throw new Error(
        `Category "${categoryName}" not found in DB. ` +
        `Please ensure seedCategories() creates this category. ` +
        `Current categories in DB: ${await categoryRepo.find().then(c => c.map(cat => cat.name).join(', '))}`
      );
    }

    let skill = await skillRepo.findOne({
      where: {
        owner: { id: owner.id },
        title,
        category: { id: category.id },
      },
      relations: ['owner', 'category'],
    });

    if (!skill) {
      skill = await skillRepo.save({
        title,
        description: `[TEST] ${title}`,
        images: [],
        owner,
        category,
      });
    }
    return skill.id;
  }

  async function createTestRequest(): Promise<string> {
    const offeredSkillId = await ensureSkillExists(
      'maria@skillswap.ru',
      'Начальный Node.js',
      'Backend',
    );
    const requestedSkillId = await ensureSkillExists(
      'ivan@skillswap.ru',
      'Agile/Scrum',
      'Управление командой',
    );

    const payload = { offeredSkillId, requestedSkillId };

    const res = await request(app.getHttpServer())
      .post('/requests')
      .set('Authorization', `Bearer ${mariaToken}`)
      .send(payload);

    expect(res.status).toBe(201);
    return (res.body as RequestResponse).id;
  }

  describe('POST /requests', () => {
    it('should create a request with valid dynamic skill IDs', async () => {
      const offeredSkillId = await ensureSkillExists(
        'maria@skillswap.ru',
        'Начальный Node.js',
        'Backend',
      );
      const requestedSkillId = await ensureSkillExists(
        'ivan@skillswap.ru',
        'Agile/Scrum',
        'Управление командой',
      );

      const payload = { offeredSkillId, requestedSkillId };

      const res = await request(app.getHttpServer())
        .post('/requests')
        .set('Authorization', `Bearer ${mariaToken}`)
        .send(payload);

      expect(res.status).toBe(201);
      const body = res.body as RequestResponse;
      expect(body.id).toBeDefined();
      expect(body.status).toBe('pending');
      expect(body.offeredSkill.id).toBe(offeredSkillId);
      expect(body.requestedSkill.id).toBe(requestedSkillId);
    });

    it('should reject request to self (sender owns requested skill)', async () => {
      const skillId = await ensureSkillExists(
        'maria@skillswap.ru',
        'Основы React',
        'Frontend',
      );

      const payload = {
        offeredSkillId: skillId,
        requestedSkillId: skillId,
      };

      const res = await request(app.getHttpServer())
        .post('/requests')
        .set('Authorization', `Bearer ${mariaToken}`)
        .send(payload);

      expect(res.status).toBe(409);
    });

    it('should reject invalid UUIDs', async () => {
      const payload = {
        offeredSkillId: 'not-a-uuid',
        requestedSkillId: 'also-not-uuid',
      };
      const res = await request(app.getHttpServer())
        .post('/requests')
        .set('Authorization', `Bearer ${mariaToken}`)
        .send(payload);
      expect(res.status).toBe(400);
    });
  });

  describe('GET /requests/incoming & outgoing', () => {
    let requestId: string;
    beforeEach(async () => {
      requestId = await createTestRequest();
    });

    it('should list incoming requests for receiver (Ivan)', async () => {
      const res = await request(app.getHttpServer())
        .get('/requests/incoming')
        .set('Authorization', `Bearer ${ivanToken}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(
        (res.body as RequestResponse[]).some((r) => r.id === requestId),
      ).toBe(true);
    });

    it('should list outgoing requests for sender (Maria)', async () => {
      const res = await request(app.getHttpServer())
        .get('/requests/outgoing')
        .set('Authorization', `Bearer ${mariaToken}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(
        (res.body as RequestResponse[]).some((r) => r.id === requestId),
      ).toBe(true);
    });
  });

  describe('PATCH /requests/:id/accept', () => {
    let requestId: string;
    beforeEach(async () => {
      requestId = await createTestRequest();
    });

    it('should accept request (only receiver - Ivan)', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/requests/${requestId}/accept`)
        .set('Authorization', `Bearer ${ivanToken}`);

      expect(res.status).toBe(200);
      expect((res.body as RequestResponse).status).toBe('accepted');
    });

    it('should reject accept if called by sender (Maria)', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/requests/${requestId}/accept`)
        .set('Authorization', `Bearer ${mariaToken}`);

      expect(res.status).toBe(409);
    });
  });

  describe('PATCH /requests/:id/reject', () => {
    let requestId: string;
    beforeEach(async () => {
      requestId = await createTestRequest();
    });

    it('should reject request (only receiver)', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/requests/${requestId}/reject`)
        .set('Authorization', `Bearer ${ivanToken}`);

      expect(res.status).toBe(200);
      expect((res.body as RequestResponse).status).toBe('rejected');
    });

    it('should reject if called by sender', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/requests/${requestId}/reject`)
        .set('Authorization', `Bearer ${mariaToken}`);

      expect(res.status).toBe(409);
    });
  });

  describe('PATCH /requests/:id/read', () => {
    let requestId: string;
    beforeEach(async () => {
      requestId = await createTestRequest();
    });

    it('should mark as read (only receiver)', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/requests/${requestId}/read`)
        .set('Authorization', `Bearer ${ivanToken}`);

      expect(res.status).toBe(200);
      expect((res.body as RequestResponse).isRead).toBe(true);
    });

    it('should reject mark as read if called by sender', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/requests/${requestId}/read`)
        .set('Authorization', `Bearer ${mariaToken}`);

      expect(res.status).toBe(409);
    });
  });

  describe('DELETE /requests/:id', () => {
    let requestId: string;
    beforeEach(async () => {
      requestId = await createTestRequest();
    });

    it('should delete request (sender - Maria)', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/requests/${requestId}`)
        .set('Authorization', `Bearer ${mariaToken}`);

      expect(res.status).toBe(200);

      const listRes = await request(app.getHttpServer())
        .get('/requests/outgoing')
        .set('Authorization', `Bearer ${mariaToken}`);

      expect(
        !(listRes.body as RequestResponse[]).some((r) => r.id === requestId),
      ).toBe(true);
    });

    it('should allow admin to delete any request', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/requests/${requestId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
    });

    it('should reject delete if called by non-sender non-admin (Ivan)', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/requests/${requestId}`)
        .set('Authorization', `Bearer ${ivanToken}`);

      expect(res.status).toBe(403);
    });
  });
});
