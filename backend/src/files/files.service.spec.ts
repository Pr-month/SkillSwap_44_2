import { Test, TestingModule } from '@nestjs/testing';
import { FilesService } from './files.service';

describe('FilesService', () => {
  let service: FilesService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [FilesService],
    }).compile();

    service = module.get<FilesService>(FilesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('uploadFile', () => {
    it('should return success response with filename and publicUrl', () => {
      const file = {
        filename: 'abc123.png',
        originalname: 'photo.png',
        mimetype: 'image/png',
        size: 1024,
      } as Express.Multer.File;

      const result = service.uploadFile(file);

      expect(result).toEqual({
        message: 'File uploaded successfully',
        filename: 'abc123.png',
        publicUrl: '/uploads/abc123.png',
      });
    });

    it('should throw HttpException when an error occurs', () => {
      const file = null as unknown as Express.Multer.File;

      expect(() => service.uploadFile(file)).toThrow('Failed to save file');
    });
  });
});
