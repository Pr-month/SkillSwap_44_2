import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';

@Injectable()
export class FilesService {
  async uploadFile(file: Express.Multer.File) {
    try {
      const filePath = path.join('public', 'uploads', file.filename);
      await fs.writeFile(filePath, file.buffer);

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
