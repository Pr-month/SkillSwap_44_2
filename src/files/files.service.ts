import { Injectable, HttpException, HttpStatus } from '@nestjs/common';

@Injectable()
export class FilesService {
  uploadFile(file: Express.Multer.File) {
    try {
      const publicUrl = `/uploads/${file.filename}`;

      return {
        message: 'File uploaded successfully',
        filename: file.filename,
        publicUrl,
      };
    } catch (_error) {
      throw new HttpException(
        'Failed to save file',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
