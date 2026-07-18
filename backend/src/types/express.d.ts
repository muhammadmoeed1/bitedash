import type { user_role } from '../generated/prisma/enums';

declare global {
  namespace Express {
    interface Request {
      user?: { userId: number; role: user_role };
    }
  }
}

export {};
