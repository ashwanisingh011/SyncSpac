import express from 'express';
import { protect } from '../middleware/auth.js';

import {
    register,
    login,
    verifyEmail,
    resendVerification,
    forgotPassword,
    resetPassword,
    verifyLogin2FA,
    requestEnable2FA,
    confirmEnable2FA,
    refreshTokenHandler,
    logout,
    toggle2FA,
    getActiveSessions,
    revokeSession,
    logoutAll,
    changePassword,
    requestEmailChange,
    verifyEmailChange,
    googleAuth,
    googleCallback,
    githubAuth,
    githubCallback
} from '../controllers/authController.js';

const router = express.Router();

// Basic Auth (Public)
router.post('/register', register);
router.get('/register', (req, res) => res.redirect(process.env.FRONTEND_URL ? `${process.env.FRONTEND_URL}/register` : 'http://localhost:3000/register'));
router.post('/login', login);
router.get('/login', (req, res) => res.redirect(process.env.FRONTEND_URL ? `${process.env.FRONTEND_URL}/login` : 'http://localhost:3000/login'));
router.post('/login/2fa', verifyLogin2FA);
router.get('/google', googleAuth);
router.get('/google/callback', googleCallback);
router.get('/github', githubAuth);
router.get('/github/callback', githubCallback);

router.get('/verifyemail/:token', verifyEmail);
router.post('/resend-verification', resendVerification);

// Account Recovery (Public)
router.post('/forgotpassword', forgotPassword);
router.patch('/resetpassword/:resetToken', resetPassword);

// 2FA Management (Protected - User must be logged in to change settings)
router.patch('/2fa', protect, toggle2FA);
router.post('/2fa/enable/request', protect, requestEnable2FA);
router.post('/2fa/enable/confirm', protect, confirmEnable2FA);

// Session Management
router.post('/refresh', refreshTokenHandler);
router.post('/logout', logout);
router.get('/sessions', protect, getActiveSessions);
router.delete('/sessions/:id', protect, revokeSession);
router.post('/logout-all', protect, logoutAll);

router.patch('/change-password', protect, changePassword);
router.post('/request-email-change', protect, requestEmailChange);
router.post('/verify-email-change/:token', verifyEmailChange);

export default router;

