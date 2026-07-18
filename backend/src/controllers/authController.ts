import { Request, Response, NextFunction } from 'express'
import User, { type IUser } from '../models/User.js'
import crypto from 'crypto'
import Session from '../models/Session.js'
import { generateAccessToken, generateRefreshToken } from '../utils/generateToken.js';
import jwt from 'jsonwebtoken';
import { addEmailJob } from '../config/queue.js';
import {
    buildVerifyEmail,
    buildLoginOTPEmail,
    buildEnable2FAEmail,
    buildPasswordResetEmail,
    buildEmailChangeEmail,
    buildPasswordChangedNotificationEmail,
    buildEmailChangedNotificationEmail,
    buildWelcomeEmail
} from '../utils/emailTemplate.js';
import mongoose from 'mongoose';
import axios from 'axios';

function toAuthUserPayload(user: IUser) {
    return {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        isTwoFactorEnabled: user.isTwoFactorEnabled,
        phoneNumber: user.phoneNumber,
        designation: user.designation,
    };
}

const upsertSession = async (
    userId: mongoose.Types.ObjectId,
    refreshToken: string,
    userAgent: string,
    ipAddress: string,
    expiresAt: Date
): Promise<void> => {
    let session = await Session.findOne({
        user: userId,
        userAgent
    });

    if (session) {
        session.refreshToken = refreshToken;
        session.ipAddress = ipAddress;
        session.expiresAt = expiresAt;
        session.lastActivityAt = new Date();
        await session.save();
    } else {
        await Session.create({
            user: userId,
            refreshToken,
            userAgent,
            ipAddress,
            expiresAt,
            lastActivityAt: new Date()
        });
    }
};


/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 */
export const register = async (req: Request, res: Response): Promise<void> => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            res.status(400).json({ success: false, message: 'Please provide name, email, and password' });
            return;
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            res.status(409).json({ success: false, message: 'Email already in use' });
            return;
        }

        const user = await User.create({ name, email, password });

        const resetToken = crypto.randomBytes(20).toString('hex');
        user.verificationToken = crypto.createHash('sha256').update(resetToken).digest('hex');
        user.verificationTokenExpire = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
        await user.save({ validateBeforeSave: false });

        const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email/${resetToken}`;
        const { message, html } = buildVerifyEmail(verifyUrl);

        await addEmailJob(user.email, 'TaskBridge - Verify Your Email', message, html);

        res.status(201).json({
            success: true,
            message: "Registration successful",
            data: {
                token: generateAccessToken(user._id as mongoose.Types.ObjectId),
                user: toAuthUserPayload(user),
            }
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};



/**
 * @desc    Login user
 * @route   POST /api/auth/login
 */
export const login = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            res.status(400).json({ success: false, message: 'Please provide email and password' });
            return;
        }

        const user = await User.findOne({ email });
        if (!user || !(await user.comparePassword(password))) {
            res.status(401).json({ success: false, message: 'Invalid email or password' });
            return;
        }

        if (!user.isVerified) {
            res.status(403).json({
                success: false,
                message: "Please verify your email address before logging in."
            });
            return;
        }


        if (user.isTwoFactorEnabled) {
            const otp = crypto.randomInt(100000, 1000000).toString();
            const hashedOTP = crypto.createHash('sha256').update(otp).digest('hex');

            user.twoFactorOTP = hashedOTP;
            user.twoFactorOTPExpire = new Date(Date.now() + 10 * 60 * 1000); // 10 min.
            await user.save({ validateBeforeSave: false });

            const { message, html } = buildLoginOTPEmail(otp);
            await addEmailJob(user.email, 'TaskBridge - Login Verification Code', message, html);

            res.status(200).json({
                success: true,
                message: "2FA Verification Required",
                data: {
                    requires2FA: true,
                    email: user.email,
                    userId: user._id
                }
            });
            return;
        }

        const accessToken = generateAccessToken(user._id as mongoose.Types.ObjectId);
        const refreshToken = generateRefreshToken(user._id as mongoose.Types.ObjectId);

        const userAgent = req.headers['user-agent'] || 'Unknown Device';
        const ipAddress = req.ip || req.socket.remoteAddress || 'Unknown IP';
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 Days
        const lastActivityAt = new Date();

        await upsertSession(
            user._id as mongoose.Types.ObjectId,
            refreshToken,
            userAgent,
            ipAddress,
            expiresAt
        );

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        res.status(200).json({
            success: true,
            message: "Login successful",
            data: {
                token: accessToken,
                user: toAuthUserPayload(user),
            }
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

/**
 * @desc    Redirects client to Google OAuth Consent Screen
 * @route   GET /api/auth/google
 * @access  Public
 */

export const googleAuth = (req: Request, res: Response): void => {
    const rootUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
    const options = {
        redirect_uri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5001/api/auth/google/callback',
        client_id: process.env.GOOGLE_CLIENT_ID!,
        access_type: 'offline',
        response_type: 'code',
        prompt: 'consent',
        scope: [
            'https://www.googleapis.com/auth/userinfo.profile',
            'https://www.googleapis.com/auth/userinfo.email',
        ].join(' '),
    };
    const queryString = new URLSearchParams(options).toString();
    res.redirect(`${rootUrl}?${queryString}`);
};

/**
 * @desc    Handles Google Authorization Code Exchange & Session Generation
 * @route   GET /api/auth/google/callback
 * @access  Public
 */

export const googleCallback = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const code = req.query.code as string
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    if (!code) {
        res.redirect(`${frontendUrl}/login?error=OAuthFailed`);
        return;
    }
    try {
        const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
            code,
            client_id: process.env.GOOGLE_CLIENT_ID,
            client_secret: process.env.GOOGLE_CLIENT_SECRET,
            redirect_uri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5001/api/auth/google/callback',
            grant_type: 'authorization_code',
        });

        const { access_token } = tokenResponse.data;


        const userResponse = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: { Authorization: `Bearer ${access_token}` },
        });

        const { id: googleId, email, name, picture, verified_email, email_verified } = userResponse.data;

        if (!verified_email && !email_verified) {
            res.status(400).json({ success: false, message: 'Google account email is not verified' });
            return;
        }

        // 3. Match Accounts or Upsert New Profile
        let user = await User.findOne({ $or: [{ googleId }, { email: email.toLowerCase() }] });

        if (user) {
            if (!user.googleId) {
                user.googleId = googleId;
                if (!user.avatar) user.avatar = picture;
                await user.save({ validateBeforeSave: false });
            }
        } else {
            user = await User.create({
                name,
                email: email.toLowerCase(),
                googleId,
                avatar: picture,
                isVerified: true,
            });
            try {
                const loginUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
                const welcome = buildWelcomeEmail(user.name, loginUrl);
                await addEmailJob(user.email, 'Welcome to TaskBridge!', welcome.message, welcome.html);
            } catch (emailError) {
                console.error('Failed to send welcome email:', emailError);
            }
        }

        const accessToken = generateAccessToken(user._id as mongoose.Types.ObjectId);
        const refreshToken = generateRefreshToken(user._id as mongoose.Types.ObjectId);

        const userAgent = req.headers['user-agent'] || 'Unknown Device';
        const ipAddress = req.ip || req.socket.remoteAddress || 'Unknown IP';
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

        // Save active device context directly into your Session model (upserting to avoid duplicates)
        await upsertSession(
            user._id as mongoose.Types.ObjectId,
            refreshToken,
            userAgent,
            ipAddress,
            expiresAt
        );

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        const encodedUser = encodeURIComponent(JSON.stringify(toAuthUserPayload(user)));
        res.redirect(`${frontendUrl}/auth/callback?token=${accessToken}&user=${encodedUser}`);
    } catch (error: any) {
        console.error('Google OAuth Error:', error);
        res.redirect(`${frontendUrl}/login?error=OAuthProcessingError`);
    }
}

/**
 * @desc    Redirects client to GitHub Login Screen
 * @route   GET /api/auth/github
 * @access  Public
 */

export const githubAuth = (req: Request, res: Response): void => {
    const rootUrl = 'https://github.com/login/oauth/authorize';
    const options = {
        client_id: process.env.GITHUB_CLIENT_ID!,
        redirect_uri: process.env.GITHUB_REDIRECT_URI || 'http://localhost:5001/api/auth/github/callback',
        scope: 'user:email',
    };

    const queryString = new URLSearchParams(options).toString();
    res.redirect(`${rootUrl}?${queryString}`);
};

/**
 * @desc    Handles GitHub Authorization Code Exchange & Session Generation
 * @route   GET /api/auth/github/callback
 * @access  Public
 */
export const githubCallback = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const code = req.query.code as string;
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    if (!code) {
        res.redirect(`${frontendUrl}/login?error=OAuthFailed`);
        return;
    }

    try {

        const tokenResponse = await axios.post('https://github.com/login/oauth/access_token', {
            client_id: process.env.GITHUB_CLIENT_ID,
            client_secret: process.env.GITHUB_CLIENT_SECRET,
            code,
            redirect_uri: process.env.GITHUB_REDIRECT_URI || 'http://localhost:5001/api/auth/github/callback',
        }, {
            headers: { Accept: 'application/json' }
        });

        const { access_token } = tokenResponse.data;


        const profileResponse = await axios.get('https://api.github.com/user', {
            headers: { Authorization: `token ${access_token}` },
        });

        const { id: githubId, name, login, avatar_url } = profileResponse.data;


        const emailResponse = await axios.get('https://api.github.com/user/emails', {
            headers: { Authorization: `token ${access_token}` },
        });

        const primaryEmailRecord = emailResponse.data.find((e: any) => e.primary && e.verified) || emailResponse.data.find((e: any) => e.verified);

        if (!primaryEmailRecord) {
            res.redirect(`${frontendUrl}/login?error=EmailNotVerified`);
            return;
        }

        const email = primaryEmailRecord.email;


        let user = await User.findOne({ $or: [{ githubId: githubId.toString() }, { email: email.toLowerCase() }] });

        if (user) {
            if (!user.githubId) {
                user.githubId = githubId.toString();
                if (!user.avatar) user.avatar = avatar_url;
                await user.save({ validateBeforeSave: false });
            }
        } else {
            user = await User.create({
                name: name || login,
                email: email.toLowerCase(),
                githubId: githubId.toString(),
                avatar: avatar_url,
                isVerified: true,
            });
            try {
                const loginUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
                const welcome = buildWelcomeEmail(user.name, loginUrl);
                await addEmailJob(user.email, 'Welcome to TaskBridge!', welcome.message, welcome.html);
            } catch (emailError) {
                console.error('Failed to send welcome email:', emailError);
            }
        }


        const accessToken = generateAccessToken(user._id as mongoose.Types.ObjectId);
        const refreshToken = generateRefreshToken(user._id as mongoose.Types.ObjectId);

        const userAgent = req.headers['user-agent'] || 'Unknown Device';
        const ipAddress = req.ip || req.socket.remoteAddress || 'Unknown IP';
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

        // Save active device context directly into your Session model (upserting to avoid duplicates)
        await upsertSession(
            user._id as mongoose.Types.ObjectId,
            refreshToken,
            userAgent,
            ipAddress,
            expiresAt
        );

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        const encodedUser = encodeURIComponent(JSON.stringify(toAuthUserPayload(user)));
        res.redirect(`${frontendUrl}/auth/callback?token=${accessToken}&user=${encodedUser}`);

    } catch (error: any) {
        console.error('GitHub OAuth Error:', error);
        res.redirect(`${frontendUrl}/login?error=OAuthProcessingError`);
    }
};



export const resendVerification = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email } = req.body;

        if (!email) {
            res.status(400).json({ success: false, message: 'Please provide an email' });
            return;
        }

        const user = await User.findOne({ email });

        if (!user) {
            res.status(200).json({
                success: true,
                message: 'If an account with that email exists, a verification link has been sent.',
            });
            return;
        }

        if (user.isVerified) {
            res.status(400).json({ success: false, message: 'Email is already verified' });
            return;
        }

        const resetToken = crypto.randomBytes(20).toString('hex');
        user.verificationToken = crypto.createHash('sha256').update(resetToken).digest('hex');
        user.verificationTokenExpire = new Date(Date.now() + 24 * 60 * 60 * 1000);
        await user.save({ validateBeforeSave: false });

        const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email/${resetToken}`;
        const { message, html } = buildVerifyEmail(verifyUrl);

        await addEmailJob(user.email, 'TaskBridge - Verify Your Email', message, html);

        res.status(200).json({
            success: true,
            message: 'Verification email sent. Check your inbox.',
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

export const verifyEmail = async (req: Request, res: Response): Promise<void> => {
    try {
        const { token } = req.params;
        if (!token || typeof token !== 'string') {
            res.status(400).json({ success: false, message: "Invalid token format" });
            return;
        }

        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        const user = await User.findOne({
            verificationToken: hashedToken,
            verificationTokenExpire: { $gt: Date.now() }
        });

        if (!user) {
            res.status(400).json({ success: false, message: "Invalid or expired verification token" });
            return;
        }

        user.isVerified = true;
        user.verificationToken = undefined;
        user.verificationTokenExpire = undefined;

        await user.save({ validateBeforeSave: false });

        try {
            const loginUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
            const welcome = buildWelcomeEmail(user.name, loginUrl);
            await addEmailJob(user.email, 'Welcome to TaskBridge!', welcome.message, welcome.html);
        } catch (emailError) {
            console.error('Failed to send welcome email:', emailError);
        }

        const accessToken = generateAccessToken(user._id as mongoose.Types.ObjectId);

        res.status(200).json({
            success: true,
            message: "Email verified successfully!",

            data: {
                token: accessToken,
                user: toAuthUserPayload(user),
            },
        });

    } catch (error: any) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

export const toggle2FA = async (req: Request, res: Response): Promise<void> => {
    try {
        const { enabled } = req.body;

        if (typeof enabled !== 'boolean') {
            res.status(400).json({ success: false, message: 'Please provide enabled as true or false' });
            return;
        }

        const user = await User.findById(req.user?._id);

        if (!user) {
            res.status(404).json({ success: false, message: 'User not found' });
            return;
        }

        user.isTwoFactorEnabled = enabled;
        if (!enabled) {
            user.twoFactorOTP = undefined;
            user.twoFactorOTPExpire = undefined;
        }

        await user.save({ validateBeforeSave: false });

        res.status(200).json({
            success: true,
            message: enabled
                ? 'Two-factor authentication is now enabled'
                : 'Two-factor authentication is now disabled',
            data: { isTwoFactorEnabled: user.isTwoFactorEnabled },
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

export const requestEnable2FA = async (req: Request, res: Response): Promise<void> => {
    try {
        const user = await User.findById(req.user?._id)

        if (!user) {
            res.status(404).json({ success: false, message: "User not found" })
            return;
        }

        if (user.isTwoFactorEnabled) {
            res.status(400).json({ success: false, message: "2FA is already enabled for this account" });
            return;
        }

        const otp = crypto.randomInt(100000, 1000000).toString();
        const hashedOTP = crypto.createHash('sha256').update(otp).digest('hex');

        user.twoFactorOTP = hashedOTP;
        user.twoFactorOTPExpire = new Date(Date.now() + 10 * 60 * 1000); // 10 min.

        await user.save({ validateBeforeSave: false });

        const { message, html } = buildEnable2FAEmail(otp);

        await addEmailJob(user.email, 'TaskBridge - Enable 2FA Verification Code', message, html);

        res.status(200).json({
            success: true,
            message: "Verification code sent to your email. Please submit it to finish enabling 2FA"
        })
    } catch (error: any) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }

}

export const confirmEnable2FA = async (req: Request, res: Response): Promise<void> => {
    try {
        const { otp } = req.body;

        if (!otp) {
            res.status(400).json({ success: false, message: "OTP is required" });
            return;
        }
        const cleanOtp = String(otp).trim();
        const hashedOTP = crypto.createHash('sha256').update(cleanOtp).digest('hex');


        const user = await User.findById(req.user?._id).select('+twoFactorOTP +twoFactorOTPExpire');
        if (!user) {
            res.status(400).json({ success: false, message: "Invalid or expired verification code" });
            return;
        }
        if (!user.twoFactorOTP || user.twoFactorOTP !== hashedOTP) {
            res.status(400).json({ success: false, message: "Invalid verification code" });
            return;
        }

        if (!user.twoFactorOTPExpire || user.twoFactorOTPExpire.getTime() < Date.now()) {
            res.status(400).json({ success: false, message: "Verification code has expired. Please request a new one." });
            return;
        }

        user.isTwoFactorEnabled = true;
        user.twoFactorOTP = undefined;
        user.twoFactorOTPExpire = undefined;
        await user.save({ validateBeforeSave: false });

        res.status(200).json({
            success: true,
            message: "Two-Factor Authentication is now enabled for your account"
        })
    } catch (error) {
        res.status(500).json({ success: false, message: "server Error", error: error })
    }
}


export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
    try {
        const user = await User.findOne({ email: req.body.email });

        if (!user) {
            res.status(200).json({ success: true, message: "If an account with that email exists, a reset link has been sent." });
            return;
        }

        const resetToken = crypto.randomBytes(32).toString('hex');

        user.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');

        user.passwordResetExpire = new Date(Date.now() + 10 * 60 * 1000);


        await user.save({ validateBeforeSave: false });

        const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password/${resetToken}`;
        const { message, html } = buildPasswordResetEmail(resetUrl);

        try {
            await addEmailJob(user.email, "TaskBridge - Password Reset Request", message, html);
            res.status(200).json({
                success: true,
                message: "Password reset link sent to your email.",

            });
        } catch (error) {

            console.error("NODEMAILER ERROR:", error);
            user.passwordResetToken = undefined;
            user.passwordResetExpire = undefined;
            await user.save({ validateBeforeSave: false });

            res.status(500).json({
                success: false,
                message: "Email could not be sent. Please try again."
            });
        }

    } catch (error: any) {
        res.status(500).json({ success: false, message: "Internal server error", error: error.message });
    }
};

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
    try {

        const { resetToken } = req.params;

        if (typeof resetToken !== 'string') {
            res.status(400).json({
                success: false,
                message: "Invalid token format."
            });
            return;
        }


        const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');


        const user = await User.findOne({
            passwordResetToken: hashedToken,
            passwordResetExpire: { $gt: Date.now() }
        });

        if (!user) {
            res.status(400).json({
                success: false,
                message: "Password reset token is invalid or has expired."
            });
            return;
        }
        user.password = req.body.password;

        user.passwordResetToken = undefined;
        user.passwordResetExpire = undefined;

        await user.save();

        const { message: changeMsg, html: changeHtml } = buildPasswordChangedNotificationEmail();
        await addEmailJob(user.email, 'TaskBridge - Password Changed', changeMsg, changeHtml);

        res.status(200).json({
            success: true,
            message: "Password has been successfully reset. You can now log in."
        });

    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: "Internal server error during password reset",
            error: error.message
        });
    }
};

export const verifyLogin2FA = async (req: Request, res: Response): Promise<void> => {
    try {

        const { email, otp } = req.body;

        if (!email || !otp) {
            res.status(400).json({ success: false, message: "Email and OTP are required" });
            return;
        }
        const cleanOtp = String(otp).trim();
        const hashedOTP = crypto.createHash('sha256').update(cleanOtp).digest('hex');

        const user = await User.findOne({ email }).select('+twoFactorOTP +twoFactorOTPExpire');

        if (!user) {
            res.status(404).json({ success: false, message: "User not found" });
            return;
        }

        if (!user.twoFactorOTP || user.twoFactorOTP !== hashedOTP) {
            res.status(401).json({ success: false, message: "Invalid verification code" });
            return;
        }

        if (!user.twoFactorOTPExpire || user.twoFactorOTPExpire.getTime() < Date.now()) {
            res.status(401).json({ success: false, message: "Verification code has expired" });
            return;
        }

        user.twoFactorOTP = undefined;
        user.twoFactorOTPExpire = undefined;
        await user.save({ validateBeforeSave: false });

        const accessToken = generateAccessToken(user._id as mongoose.Types.ObjectId);
        const refreshToken = generateRefreshToken(user._id as mongoose.Types.ObjectId);

        const userAgent = req.headers['user-agent'] || 'Unknown Device';
        const ipAddress = req.ip || req.socket.remoteAddress || 'Unknown IP';
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        const lastActivityAt = new Date();

        await upsertSession(
            user._id as mongoose.Types.ObjectId,
            refreshToken,
            userAgent,
            ipAddress,
            expiresAt
        );

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        res.status(200).json({
            success: true,
            message: "2FA Login successful",
            data: {
                token: accessToken,
                user: toAuthUserPayload(user),
            }
        })

    } catch (error) {
        res.status(500).json({ success: false, message: "Server error", error: error });
    }
};
export const refreshTokenHandler = async (req: Request, res: Response): Promise<void> => {
    try {
        const cookies = req.cookies;
        if (!cookies?.refreshToken) {
            res.status(401).json({ success: false, message: "Refresh token missing" });
            return;
        }

        const refreshToken = cookies.refreshToken;

        // Find the active session in MongoDB
        const session = await Session.findOne({ refreshToken });
        if (!session || session.expiresAt.getTime() < Date.now()) {
            res.status(401).json({ success: false, message: "Invalid or expired session" });
            return;
        }

        // Verify the token cryptographically
        try {
            jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET as string);
        } catch (err) {
            res.status(401).json({ success: false, message: "Invalid session token" });
            return;
        }

        session.lastActivityAt = new Date();
        await session.save();

        // Generate a fresh 15-minute access token
        const newAccessToken = generateAccessToken(session.user);

        res.status(200).json({
            success: true,
            token: newAccessToken
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: "Server error during token refresh", error: error.message });
    }
};

/**
 * @desc    Logout User / Revoke Device Session
 * @route   POST /api/auth/logout
 */
export const logout = async (req: Request, res: Response): Promise<void> => {
    try {
        const cookies = req.cookies;
        if (!cookies?.refreshToken) {
            res.sendStatus(204); // No content
            return;
        }

        const refreshToken = cookies.refreshToken;

        // 1. Delete the session completely from MongoDB
        await Session.findOneAndDelete({ refreshToken });

        // 2. Clear the cookie from the client's browser
        res.clearCookie('refreshToken', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict'
        });

        res.status(200).json({ success: true, message: "Logged out successfully, session revoked." });
    } catch (error: any) {
        res.status(500).json({ success: false, message: "Server error during logout", error: error.message });
    }
};

/**
 * @desc    Get all active sessions for current user
 * @route   GET /api/auth/sessions
 * @access  Private
 */
export const getActiveSessions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        await Session.deleteMany({ expiresAt: { $lt: new Date() } });

        const sessions = await Session.find({ user: req.user?._id }).sort({ lastActivityAt: -1, createdAt: -1 });
        const currentToken = req.cookies?.refreshToken;

        const sessionData = sessions.map(session => ({
            id: session._id,
            ipAddress: session.ipAddress || 'Unknown',
            userAgent: session.userAgent || 'Unknown Device',
            expiresAt: session.expiresAt,
            createdAt: session.createdAt,
            lastActivityAt: session.lastActivityAt || session.updatedAt,
            isCurrent: session.refreshToken === currentToken
        }));

        res.status(200).json({
            success: true,
            data: sessionData
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Revoke/Delete a specific device session
 * @route   DELETE /api/auth/sessions/:id
 * @access  Private
 */
export const revokeSession = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;

        const session = await Session.findOne({ _id: id, user: req.user?._id });
        if (!session) {
            res.status(404).json({ success: false, message: 'Session not found or unauthorized' });
            return;
        }

        const currentToken = req.cookies?.refreshToken;
        const isCurrent = session.refreshToken === currentToken;

        await Session.findByIdAndDelete(id);

        if (isCurrent) {
            res.clearCookie('refreshToken', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Session revoked successfully',
            data: { isCurrent }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Logout from all devices / Revoke all sessions
 * @route   POST /api/auth/logout-all
 * @access  Private
 */
export const logoutAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        await Session.deleteMany({ user: req.user?._id });

        res.clearCookie('refreshToken', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict'
        });

        res.status(200).json({
            success: true,
            message: 'All device sessions revoked successfully'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Change Password
 * @route   PATCH /api/auth/change-password
 * @access  Private
 */
export const changePassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            res.status(400).json({ success: false, message: 'Please provide current and new passwords' });
            return;
        }

        const user = await User.findById(req.user?._id).select('+password');
        if (!user) {
            res.status(404).json({ success: false, message: 'User not found' });
            return;
        }

        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            res.status(401).json({ success: false, message: 'Incorrect current password' });
            return;
        }

        user.password = newPassword;
        await user.save();

        const { message: changeMsg, html: changeHtml } = buildPasswordChangedNotificationEmail();
        await addEmailJob(user.email, 'TaskBridge - Password Changed', changeMsg, changeHtml);

        res.status(200).json({ success: true, message: 'Password changed successfully' });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Request Email Change
 * @route   POST /api/auth/request-email-change
 * @access  Private
 */
export const requestEmailChange = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { newEmail } = req.body;
        if (!newEmail) {
            res.status(400).json({ success: false, message: 'Please provide a new email address' });
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(newEmail)) {
            res.status(400).json({ success: false, message: 'Please provide a valid email address' });
            return;
        }

        const existingUser = await User.findOne({ email: newEmail });
        if (existingUser) {
            res.status(409).json({ success: false, message: 'Email is already in use by another account' });
            return;
        }

        const user = await User.findById(req.user?._id);
        if (!user) {
            res.status(404).json({ success: false, message: 'User not found' });
            return;
        }

        const token = crypto.randomBytes(20).toString('hex');
        user.emailChangeToken = crypto.createHash('sha256').update(token).digest('hex');
        user.emailChangeTokenExpire = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours
        user.pendingEmail = newEmail.toLowerCase();
        await user.save({ validateBeforeSave: false });

        const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email-change/${token}`;
        const { message, html } = buildEmailChangeEmail(newEmail, verifyUrl);

        await addEmailJob(newEmail, 'TaskBridge - Verify Email Change', message, html);

        res.status(200).json({ success: true, message: 'Verification link sent to the new email address' });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Verify and Apply Email Change
 * @route   POST /api/auth/verify-email-change/:token
 * @access  Public
 */
export const verifyEmailChange = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { token } = req.params;

        if (typeof token !== 'string') {
            res.status(400).json({ success: false, message: 'Invalid token format' });
            return;
        }

        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        const user = await User.findOne({
            emailChangeToken: hashedToken,
            emailChangeTokenExpire: { $gt: new Date() }
        }).select('+emailChangeToken +emailChangeTokenExpire +pendingEmail');

        if (!user || !user.pendingEmail) {
            res.status(400).json({ success: false, message: 'Invalid or expired token' });
            return;
        }

        const existingUser = await User.findOne({ email: user.pendingEmail });
        if (existingUser) {
            res.status(409).json({ success: false, message: 'Email is already in use by another account' });
            return;
        }

        const oldEmail = user.email;
        const newEmail = user.pendingEmail;

        user.email = newEmail;
        user.pendingEmail = undefined;
        user.emailChangeToken = undefined;
        user.emailChangeTokenExpire = undefined;
        await user.save();

        const { message: notifyMsg, html: notifyHtml } = buildEmailChangedNotificationEmail(oldEmail, newEmail);
        await addEmailJob(oldEmail, 'TaskBridge - Email Address Changed', notifyMsg, notifyHtml);

        res.status(200).json({
            success: true,
            message: 'Email changed successfully',
            data: { user: toAuthUserPayload(user) }
        });
    } catch (error) {
        next(error);
    }
};