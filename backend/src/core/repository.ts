import { PrimaryKey, PrismaDelegate } from './types';

export interface ListArgs {
  where?: Record<string, unknown>;
  orderBy?: Record<string, 'asc' | 'desc'>;
  skip?: number;
  take?: number;
}

/** Generic data-access layer over a single Prisma model delegate. */
export class CrudRepository<T> {
  constructor(
    private readonly delegate: PrismaDelegate<T>,
    private readonly primaryKey: PrimaryKey,
  ) {}

  private get keyFields(): readonly string[] {
    return Array.isArray(this.primaryKey) ? this.primaryKey : [this.primaryKey as string];
  }

  /** Builds the `where` clause Prisma expects to uniquely identify a row, single or composite key. */
  toUniqueWhere(idParams: Record<string, string>): Record<string, unknown> {
    const keys = this.keyFields;
    if (keys.length === 1) {
      return { [keys[0]]: Number(idParams[keys[0]]) };
    }
    const compositeName = keys.join('_');
    const compositeValue: Record<string, number> = {};
    for (const key of keys) compositeValue[key] = Number(idParams[key]);
    return { [compositeName]: compositeValue };
  }

  findMany(args: ListArgs): Promise<T[]> {
    return this.delegate.findMany(args);
  }

  count(where?: Record<string, unknown>): Promise<number> {
    return this.delegate.count({ where });
  }

  findById(idParams: Record<string, string>): Promise<T | null> {
    return this.delegate.findUnique({ where: this.toUniqueWhere(idParams) });
  }

  create(data: unknown): Promise<T> {
    return this.delegate.create({ data });
  }

  update(idParams: Record<string, string>, data: unknown): Promise<T> {
    return this.delegate.update({ where: this.toUniqueWhere(idParams), data });
  }

  remove(idParams: Record<string, string>): Promise<T> {
    return this.delegate.delete({ where: this.toUniqueWhere(idParams) });
  }
}
