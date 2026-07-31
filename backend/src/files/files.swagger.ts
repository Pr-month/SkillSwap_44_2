import { applyDecorators } from '@nestjs/common';
import {
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

export function ApiFilesController() {
  return applyDecorators(ApiTags('files'));
}

export function ApiFilesUpload() {
  return applyDecorators(
    ApiOperation({ summary: 'Загрузить изображение на сервер' }),
    ApiConsumes('multipart/form-data'),
    ApiBody({
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
    }),
    ApiResponse({
      status: 201,
      description: 'Файл успешно загружен',
      schema: {
        example: {
          message: 'File uploaded successfully',
          filename: 'image-123456.png',
          publicUrl: '/uploads/image-123456.png',
        },
      },
    }),
    ApiResponse({ status: 400, description: 'Файл не передан' }),
    ApiResponse({ status: 413, description: 'Размер файла превышает 2 МБ' }),
    ApiResponse({ status: 415, description: 'Разрешены только изображения' }),
  );
}
