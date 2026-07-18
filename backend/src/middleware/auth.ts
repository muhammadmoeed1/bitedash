import { NextFunction, Request, RequestHandler, Response } from 'express';
import { HttpError } from '../core/http-error';
import { verifyAccessToken } from '../auth/jwt';
import type { user_role } from '../generated/prisma/enums';

/** Verifies the Bearer access token and attaches `req.user`. */
export const requireAuth: RequestHandler = (req, _res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    next(new HttpError(401, 'Missing or invalid Authorization header'));
    return;
  }

  const token = header.slice('Bearer '.length);
  try {
    const payload = verifyAccessToken(token);
    req.user = { userId: payload.sub, role: payload.role };
    next();
  } catch {
    next(new HttpError(401, 'Invalid or expired access token'));
  }
};

/** Restricts a route to the given roles. Must run after requireAuth. Admins always pass. */
export function requireRole(...roles: user_role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new HttpError(401, 'Not authenticated'));
      return;
    }
    if (req.user.role === 'admin' || roles.includes(req.user.role)) {
      next();
      return;
    }
    next(new HttpError(403, 'You do not have permission to perform this action'));
  };
}
