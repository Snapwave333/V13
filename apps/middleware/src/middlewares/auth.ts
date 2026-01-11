import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { ApiResponse } from '../utils/apiResponse';

export interface AuthenticatedRequest extends Request {
  user?: any;
}

export const authenticate = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return ApiResponse.error(res, 'Unauthorized: No token provided', 401);
  }

  const token = authHeader.split(' ')[1];
  const secret = env.JWT_SECRET || 'development_secret_defaults_unsafe';

  try {
    const decoded = jwt.verify(token, secret);
    req.user = decoded;
    next();
  } catch (error) {
    if (error instanceof Error) {
      // Potentially log the specific reason for failure (expired, modified, etc.)
    }
    return ApiResponse.error(res, 'Unauthorized: Invalid token', 401);
  }
};
