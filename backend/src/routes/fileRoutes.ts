import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import { uploadAttachment } from '../config/cloudinary.js';
import { validateStorageLimit } from '../middleware/subscriptionMiddleware.js';
import {
  getFiles,
  createFolder,
  uploadFile,
  deleteFile,
  downloadFolderAsZip
} from '../controllers/fileController.js';

const router = Router();

// Protect all routes
router.use(protect);

router.get('/', getFiles);
router.post('/folder', createFolder);
router.post('/upload', uploadAttachment.single('file'), validateStorageLimit(req => req.file?.size || 0), uploadFile);
router.get('/download-folder/:id', downloadFolderAsZip);
router.delete('/:id', deleteFile);


export default router;
