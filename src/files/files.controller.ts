import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import {
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { FilesService } from './files.service';
import { FileInterceptor } from '@nestjs/platform-express';

@ApiTags('files')
@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @ApiOperation({ summary: 'Загрузить изображение на сервер' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Изображение размером до 2 МБ',
        },
      },
      required: ['file'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Файл успешно загружен',
    schema: {
      example: {
        message: 'File uploaded successfully',
        filename: 'image-123456.png',
        publicUrl: '/uploads/image-123456.png',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Файл не передан' })
  @ApiResponse({ status: 413, description: 'Размер файла превышает 2 МБ' })
  @ApiResponse({ status: 415, description: 'Разрешены только изображения' })
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new HttpException('No file uploaded', HttpStatus.BAD_REQUEST);
    }

    try {
      return this.filesService.uploadFile(file);
    } catch (error) {
      if (typeof error === 'object' && error !== null && 'code' in error) {
        const code = (error as { code?: string }).code;
        if (code === 'LIMIT_FILE_SIZE') {
          throw new HttpException('File size exceeds 2MB limit', 413);
        } else if (code === 'EXTENSION') {
          throw new HttpException(
            'Only image files allowed',
            HttpStatus.UNSUPPORTED_MEDIA_TYPE,
          );
        }
      }
      throw error;
    }
  }
}
