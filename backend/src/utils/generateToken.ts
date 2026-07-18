import jwt from 'jsonwebtoken';
import { Types } from 'mongoose';


export const generateAccessToken = (userId: Types.ObjectId): string => {
    if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET is not defined in environment variables');
    }
    
    return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
        expiresIn: '15m', 
    });
};


export const generateRefreshToken = (userId: Types.ObjectId): string => {
    if (!process.env.JWT_REFRESH_SECRET) {
        throw new Error('JWT_REFRESH_SECRET is not defined in environment variables');
    }

    return jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, {
        expiresIn: '7d',
    });
};