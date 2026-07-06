import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { FilesService } from './files.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiFilesController, ApiFilesUpload } from './files.swagger';

@ApiFilesController()
@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @ApiFilesUpload()
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
