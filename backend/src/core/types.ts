import { z } from 'zod';

export type PrimaryKey = string | readonly string[];

/**
 * The subset of a Prisma model delegate's API the generic CRUD engine relies on.
 * Args are intentionally loosely typed (`any`) — each concrete Prisma delegate has its
 * own precise per-model argument types, and is cast to this shared shape at the point
 * each resource is defined (see src/resources/*.ts).
 */
export interface PrismaDelegate<T = unknown> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  findMany(args?: any): Promise<T[]>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  count(args?: any): Promise<number>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  findUnique(args: any): Promise<T | null>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  create(args: any): Promise<T>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  update(args: any): Promise<T>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete(args: any): Promise<T>;
}

export interface ResourceConfig<TRecord = unknown, TCreate = unknown, TUpdate = unknown> {
  /** Human-readable singular name, used in error messages/logs (e.g. "customer"). */
  name: string;
  /** URL path segment, e.g. "customers". */
  path: string;
  delegate: PrismaDelegate<TRecord>;
  /** Single field name, or an ordered tuple for a composite primary key. */
  primaryKey: PrimaryKey;
  createSchema: z.ZodType<TCreate>;
  updateSchema: z.ZodType<TUpdate>;
  /** Fields that may be filtered on via exact-match query params, e.g. ?customer_id=3 */
  filterableFields?: readonly string[];
  /** Fields allowed in ?sort=field:asc|desc */
  sortableFields?: readonly string[];
  /** Default ordering applied when no ?sort= is given. */
  defaultSort?: Record<string, 'asc' | 'desc'>;
}
