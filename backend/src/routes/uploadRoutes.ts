import { Router, Request, Response } from 'express';
import { uploadAvatar } from '../controllers/userController.js';
import { protect } from '../middleware/auth.js';
import { upload } from '../config/cloudinary.js'; 

const router = Router();

router.patch('/avatar', protect, upload.single('avatar'), uploadAvatar);

router.post('/logo', protect, upload.single('logo'), (req: Request, res: Response): void => {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, message: 'No image file provided.' });
      return;
    }
    res.status(200).json({
      success: true,
      message: 'Logo uploaded successfully',
      url: req.file.path,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Server error during logo upload', error: error.message });
  }
});

export default router;