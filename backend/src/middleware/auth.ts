import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User, { IUser } from '../models/User.js';
import { UserRole } from '../types/roles.js';

// Extend Express Request interface to include the user object
declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

interface JwtPayload {
  id: string;
}

export const protect = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token provided' });
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;
    
    // Select user without password
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      res.status(401).json({ message: 'Not authorized, user not found' });
      return;
    }

    if(user.isActive === false){
      res.status(403).json({
        message: 'Your account has been deactivated. Please contact support for assistance.'
      });
      return;
    }
    
    // Check if the frontend specified an active organization via headers
    const orgHeader = req.headers['x-organization-id'];
    if (orgHeader && typeof orgHeader === 'string' && mongoose.Types.ObjectId.isValid(orgHeader)) {
      const orgId = new mongoose.Types.ObjectId(orgHeader);
      
      // Verify that the user is an active member of this organization
      const membership = await mongoose.model('OrganizationMember').findOne({
        organization: orgId,
        user: user._id,
        status: 'active'
      });
      
      if (membership) {
        user.organization = orgId;
        user.role = membership.role;
      }
    } else if (!user.organization) {
      // Fallback: if no organization is set on the user model, set it to the first active membership
      const membership = await mongoose.model('OrganizationMember').findOne({
        user: user._id,
        status: 'active'
      });
      if (membership) {
        user.organization = membership.organization;
        user.role = membership.role;
        // Optionally save to the user document so it's persisted
        await User.findByIdAndUpdate(user._id, { organization: membership.organization });
      }
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Not authorized, token invalid' });
  }
};

export const authorize = (...allowedRoles: UserRole[]) => {
  return(req: Request, res: Response, next: NextFunction): void => {
    if(!req.user){
      res.status(401).json({message: "Not authorized: User object missing"})
      return;
    }
    if(allowedRoles.includes(req.user.role)){
      next();
    }else{
      res.status(403).json({message: "Forbidden: Insufficient permissions"})
    }
  }
}
