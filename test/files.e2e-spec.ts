import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import fs from 'fs';
import path from 'path';
import { FilesModule } from '../src/files/files.module';

describe('FilesController E2E', () => {
  let app: INestApplication;

  const uploadsDir = path.join(process.cwd(), 'public', 'uploads');

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [FilesModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    await app.init();
  });

  afterEach(() => {
    if (!fs.existsSync(uploadsDir)) {
      return;
    }

    const files = fs.readdirSync(uploadsDir);

    for (const filename of files) {
      fs.unlinkSync(path.join(uploadsDir, filename));
    }
  });

  afterAll(async () => {
    await app.close();
  });

  it('should upload an image', async () => {
    const imageBuffer = Buffer.from('test');

    const response = await request(app.getHttpServer())
      .post('/files/upload')
      .attach('file', imageBuffer, {
        filename: 'test.png',
        contentType: 'image/png',
      })
      .expect(201);

    expect(response.body).toMatchObject({
      message: 'File uploaded successfully',
      filename: expect.any(String),
      publicUrl: expect.any(String),
    });

    expect(response.body.publicUrl).toBe(`/uploads/${response.body.filename}`);

    const savedFilePath = path.join(
      uploadsDir,
      response.body.filename as string,
    );

    expect(fs.existsSync(savedFilePath)).toBe(true);
  });

  it('should return 400 when file is not sent', async () => {
    const response = await request(app.getHttpServer())
      .post('/files/upload')
      .expect(400);

    expect(response.body).toMatchObject({
      statusCode: 400,
      message: 'No file uploaded',
    });
  });

  it('should return 400 when file type is wrong', async () => {
    const textBuffer = Buffer.from('plain text');

    const response = await request(app.getHttpServer())
      .post('/files/upload')
      .attach('file', textBuffer, {
        filename: 'test.txt',
        contentType: 'text/plain',
      })
      .expect(400);

    expect(response.body).toMatchObject({
      statusCode: 400,
      message: 'No file uploaded',
    });
  });

  it('should return 413 when file is more than 2 MB', async () => {
    const largeFile = Buffer.alloc(2 * 1024 * 1024 + 1);

    const response = await request(app.getHttpServer())
      .post('/files/upload')
      .attach('file', largeFile, {
        filename: 'large.png',
        contentType: 'image/png',
      })
      .expect(413);

    expect(response.body.statusCode).toBe(413);
  });
});
