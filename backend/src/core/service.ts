import { CrudRepository } from './repository';
import { mapPrismaError } from './prisma-error';
import { NotFoundError } from './http-error';
import { ResourceConfig } from './types';

export interface ListQuery {
  page: number;
  pageSize: number;
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
  filters: Record<string, unknown>;
}

export interface ListResult<T> {
  data: T[];
  meta: { total: number; page: number; pageSize: number; totalPages: number };
}

/** Generic business-logic layer: translates query intent into repository calls and normalizes errors. */
export class CrudService<T, TCreate, TUpdate> {
  constructor(
    private readonly repository: CrudRepository<T>,
    private readonly config: ResourceConfig<T, TCreate, TUpdate>,
  ) {}

  async list(query: ListQuery): Promise<ListResult<T>> {
    const orderBy =
      query.sortField && this.config.sortableFields?.includes(query.sortField)
        ? { [query.sortField]: query.sortDirection ?? 'asc' }
        : this.config.defaultSort;

    const where = this.buildWhere(query.filters);
    const skip = (query.page - 1) * query.pageSize;

    const [data, total] = await Promise.all([
      this.repository.findMany({ where, orderBy, skip, take: query.pageSize }),
      this.repository.count(where),
    ]);

    return {
      data,
      meta: {
        total,
        page: query.page,
        pageSize: query.pageSize,
        totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
      },
    };
  }

  private buildWhere(filters: Record<string, unknown>): Record<string, unknown> | undefined {
    const allowed = this.config.filterableFields ?? [];
    const where: Record<string, unknown> = {};
    for (const field of allowed) {
      if (filters[field] !== undefined) where[field] = filters[field];
    }
    return Object.keys(where).length ? where : undefined;
  }

  async getById(idParams: Record<string, string>): Promise<T> {
    const record = await this.repository.findById(idParams);
    if (!record) throw new NotFoundError(`${this.config.name} not found`);
    return record;
  }

  async create(data: TCreate): Promise<T> {
    try {
      return await this.repository.create(data);
    } catch (err) {
      mapPrismaError(err, this.config.name);
    }
  }

  async update(idParams: Record<string, string>, data: TUpdate): Promise<T> {
    try {
      return await this.repository.update(idParams, data);
    } catch (err) {
      mapPrismaError(err, this.config.name);
    }
  }

  async remove(idParams: Record<string, string>): Promise<T> {
    try {
      return await this.repository.remove(idParams);
    } catch (err) {
      mapPrismaError(err, this.config.name);
    }
  }
}
