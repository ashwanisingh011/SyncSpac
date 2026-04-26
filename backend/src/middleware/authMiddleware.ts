import type{ Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
    userId?: any;
}

export const protect = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const authHeader = req.headers.authorization;
    if(!authHeader ||  !authHeader.startsWith('Bearer')){
        res.status(401).json({message: "Not authorized, no token"});
        return;
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token as string, process.env.JWT_SECRET as string)
        req.userId = decoded
        next()
    }catch(error){
        console.error(error)
        res.status(401).json({ message: "Not authorized, token failed" });
    }
}
