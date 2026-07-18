import { Request, Response, NextFunction } from 'express';
import logger from '../config/logger.js';

// Custom Error Classes
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class BadRequestError extends AppError {
  constructor(message = 'Bad Request') {
    super(message, 400);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource Not Found') {
    super(message, 404);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Conflict') {
    super(message, 409);
  }
}

export class UnprocessableError extends AppError {
  constructor(message = 'Unprocessable Entity') {
    super(message, 422);
  }
}

export class TooManyRequestsError extends AppError {
  constructor(message = 'Too Many Requests') {
    super(message, 429);
  }
}

export class InternalError extends AppError {
  constructor(message = 'Internal Server Error') {
    super(message, 500, false);
  }
}

// Global Express Error Handling Middleware
export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let errors: any[] = [];

  // Handle Multer upload errors
  if (err.name === 'MulterError' || err.code?.startsWith('LIMIT_')) {
    statusCode = 400;
    if (err.code === 'LIMIT_FILE_SIZE') {
      message = 'File is too large. Maximum size allowed is 10MB.';
    } else {
      message = `Upload error: ${err.message}`;
    }
  }

  // Handle custom file filter errors
  if (err.message && (err.message.includes('Invalid file type') || err.message.includes('Supported formats'))) {
    statusCode = 400;
  }

  // Handle Cloudinary/Rate-limit 429 errors
  if (err.status === 429 || err.statusCode === 429 || (err.message && (/\b429\b/.test(err.message) || err.message.includes('Too Many Requests')))) {
    statusCode = 429;
    message = 'Too many file uploads in progress. Please wait a moment and try again.';
  }

  // Handle Mongoose validation errors
  if (err.name === 'ValidationError') {
    statusCode = 422;
    message = 'Validation Failed';
    errors = Object.values(err.errors).map((e: any) => ({
      field: e.path,
      message: e.message,
    }));
  }

  // Handle Mongoose CastError (e.g. invalid ObjectId)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid value for ${err.path}`;
    errors = [{ field: err.path, message: `Must be a valid ObjectId` }];
  }

  // Handle Mongoose duplicate key error (code 11000)
  if (err.code === 11000) {
    statusCode = 409;
    const duplicatedField = Object.keys(err.keyValue || {})[0] || 'field';
    message = `${duplicatedField.charAt(0).toUpperCase() + duplicatedField.slice(1)} already exists`;
    errors = [{ field: duplicatedField, message: 'Value is already in use' }];
  }

  // Log 5xx errors via Winston
  if (statusCode >= 500) {
    logger.error(`[5XX Error] ${req.method} ${req.originalUrl} - ${err.message}`, {
      stack: err.stack,
      ip: req.ip,
      body: req.body,
    });
  } else {
    logger.info(`[Client Error] ${req.method} ${req.originalUrl} - Status: ${statusCode} - ${message}`);
  }

  const responseBody: any = {
    success: false,
    message,
  };

  if (errors.length > 0) {
    responseBody.errors = errors;
  }

  // Expose stack trace only in development
  if (process.env.NODE_ENV === 'development') {
    responseBody.stack = err.stack;
  }

  res.status(statusCode).json(responseBody);
};
