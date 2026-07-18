import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../types/roles.js';
import ProjectMember from '../models/ProjectMember.js';

/**
 * Reusable, type-safe authorization middleware to restrict endpoint access by UserRole.
 * Expects req.user to have been populated by the protect middleware.
 */
export const authorizeRoles = (...allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient permissions.'
      });
      return;
    }
    next();
  };
};

