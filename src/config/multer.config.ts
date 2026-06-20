import * as multer from 'multer';
import { Express } from 'express';

export const multerConfig = {
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB
  },
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'public/uploads');
    },
    filename: (req, file, cb) => {
      const randomName = Math.random().toString(36).substring(2, 9);
      const extension = file.originalname.split('.').pop() || '';
      cb(null, `${randomName}.${extension}`);
    },
  }),
  fileFilter: (
    req: Express.Request,
    file: Express.Multer.File,
    callback: (error: Error | null, acceptFile: boolean) => void,
  ) => {
    const allowedTypes: string[] = ['image/jpeg', 'image/png', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
      callback(null, true);
    } else {
      callback(null, false);
    }
  },
};
