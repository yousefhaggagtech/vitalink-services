import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { AppError } from '../utils/errors';

const CLAIMS = {
  USER_ID: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier',
  USER_NAME: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name',
  ROLE: 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role',
} as const;

export enum UserRole {
  COACH = 0,
  ANALYST = 1,
}

export const ROLE_NAMES: Record<number, string> = {
  0: 'COACH',
  1: 'ANALYST',
};

export interface AuthRequest extends Request {
  user?: {
    id: string;
    name: string;
    role: UserRole;
    roleName: string;
  };
}

export const authenticate = (req: AuthRequest, _res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new AppError('Missing or invalid authorization header', 401);
    }

    const token = authHeader.split(' ')[1];

 
    const decoded = jwt.verify(token, env.jwt.secret, {
      issuer: env.jwt.issuer,
    }) as any;

    
    const tokenAud = decoded.aud;
    const expectedAud = env.jwt.audience;
    if (tokenAud && expectedAud !== '*') {
      const audList = Array.isArray(tokenAud) ? tokenAud : [tokenAud];
      if (!audList.includes(expectedAud)) {
        throw new AppError('Invalid token audience', 401);
      }
    }

    const roleValue = Number(decoded[CLAIMS.ROLE] ?? decoded.role);
    if (isNaN(roleValue) || !(roleValue in ROLE_NAMES)) {
      throw new AppError('Invalid role in token', 401);
    }

    const userId =
      decoded[CLAIMS.USER_ID] ||
      decoded.sub ||
      decoded.nameid;

    const userName =
      decoded[CLAIMS.USER_NAME] ||
      decoded.name ||
      decoded.unique_name;

    if (!userId) {
      throw new AppError('User ID not found in token', 401);
    }

    req.user = {
      id: userId,
      name: userName || 'Unknown',
      role: roleValue as UserRole,
      roleName: ROLE_NAMES[roleValue],
    };

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return next(new AppError('Token expired', 401));
    }
    if (error instanceof AppError) {
      return next(error);
    }
    next(new AppError('Invalid token', 401));
  }
};

export const requireCoach = (req: AuthRequest, _res: Response, next: NextFunction) => {
  if (!req.user) {
    return next(new AppError('Not authenticated', 401));
  }
  if (req.user.role !== UserRole.COACH) {
    return next(new AppError('Access denied. Coach role required.', 403));
  }
  next();
};