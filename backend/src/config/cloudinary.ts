import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { Request } from 'express'
import multer from 'multer';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});


const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req: Request, file) => {
    let folderPath = 'taskbridge/general';
    if (req.baseUrl.includes('users') || req.path.includes('avatar')) {
      folderPath = 'taskbridge/avatars';
    } else if (req.baseUrl.includes('workspaces') || req.path.includes('logo')) {
      folderPath = 'taskbridge/logos';
    }

    return {
      folder: folderPath,
      allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
      public_id: `${Date.now()}-${file.originalname.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9._-]/g, "_")}`,
    };
  },
});

const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images are allowed!') as any, false);
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

const attachmentStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req: Request, file) => {
    return {
      folder: 'taskbridge/attachments',
      resource_type: 'auto',
      public_id: `${Date.now()}-${file.originalname.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9._-]/g, "_")}`,
    } as any;
  },
});

const attachmentFileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimeTypes = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'application/zip',
    'application/x-zip-compressed',
    'text/csv'
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Supported formats are: Images, PDF, Word, Excel, CSV, TXT, ZIP') as any, false);
  }
};

export const uploadAttachment = multer({
  storage: attachmentStorage,
  fileFilter: attachmentFileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit for general attachments!
});