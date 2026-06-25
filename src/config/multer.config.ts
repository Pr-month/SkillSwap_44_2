import * as multer from 'multer';
import fs from 'fs';

export const multerConfig = {
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB
  },
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const dir = 'public/uploads';
      fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
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
