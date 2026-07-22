import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus } from '@nestjs/common';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';

describe('FilesController', () => {
  let controller: FilesController;

  const mockFilesService = {
    uploadFile: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [FilesController],
      providers: [
        {
          provide: FilesService,
          useValue: mockFilesService,
        },
      ],
    }).compile();

    controller = module.get<FilesController>(FilesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('uploadFile', () => {
    it('should delegate to service and return result', () => {
      const file = {
        filename: 'abc123.png',
        originalname: 'photo.png',
        mimetype: 'image/png',
        size: 1024,
      } as Express.Multer.File;

      const expected = {
        message: 'File uploaded successfully',
        filename: 'abc123.png',
        publicUrl: '/uploads/abc123.png',
      };

      mockFilesService.uploadFile.mockReturnValue(expected);

      const result = controller.uploadFile(file);

      expect(result).toEqual(expected);
      expect(mockFilesService.uploadFile).toHaveBeenCalledWith(file);
    });

    it('should throw 400 when no file is uploaded', () => {
      expect(() =>
        controller.uploadFile(undefined as unknown as Express.Multer.File),
      ).toThrow(new HttpException('No file uploaded', HttpStatus.BAD_REQUEST));

      expect(mockFilesService.uploadFile).not.toHaveBeenCalled();
    });

    it('should throw 413 when file size exceeds limit (LIMIT_FILE_SIZE)', () => {
      const error = new Error('File too large');
      (error as any).code = 'LIMIT_FILE_SIZE';

      mockFilesService.uploadFile.mockImplementation(() => {
        throw error;
      });

      const file = { filename: 'large.png' } as Express.Multer.File;

      expect(() => controller.uploadFile(file)).toThrow(
        new HttpException('File size exceeds 2MB limit', 413),
      );
    });

    it('should throw 415 when file extension is not allowed (EXTENSION)', () => {
      const error = new Error('Invalid extension');
      (error as any).code = 'EXTENSION';

      mockFilesService.uploadFile.mockImplementation(() => {
        throw error;
      });

      const file = { filename: 'file.txt' } as Express.Multer.File;

      expect(() => controller.uploadFile(file)).toThrow(
        new HttpException(
          'Only image files allowed',
          HttpStatus.UNSUPPORTED_MEDIA_TYPE,
        ),
      );
    });

    it('should re-throw unknown errors', () => {
      const error = new Error('Unexpected error');

      mockFilesService.uploadFile.mockImplementation(() => {
        throw error;
      });

      const file = { filename: 'test.png' } as Express.Multer.File;

      expect(() => controller.uploadFile(file)).toThrow(error);
    });
  });
});
