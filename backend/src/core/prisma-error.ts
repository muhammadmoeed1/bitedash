import { Prisma } from '../generated/prisma/client';
import { ConflictError, HttpError, NotFoundError } from './http-error';

/** Translates known Prisma error codes into HTTP-meaningful errors; rethrows anything else. */
export function mapPrismaError(err: unknown, resourceName: string): never {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case 'P2025':
        throw new NotFoundError(`${resourceName} not found`);
      case 'P2002': {
        const fields = (err.meta?.target as string[] | undefined)?.join(', ') ?? 'field';
        throw new ConflictError(`${resourceName} with this ${fields} already exists`);
      }
      case 'P2003':
        throw new ConflictError(`Referenced record does not exist for ${resourceName}`);
      default:
        throw new HttpError(400, `Database error (${err.code})`, { code: err.code });
    }
  }
  throw err;
}
