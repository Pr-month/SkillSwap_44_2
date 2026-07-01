import {
  Controller,
  Post,
  Body,
  UseInterceptors,
  UploadedFile,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { FilesService } from './files.service';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new HttpException('No file uploaded', HttpStatus.BAD_REQUEST);
    }

    try {
      return await this.filesService.uploadFile(file);
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
