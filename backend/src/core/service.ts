import { resolveOwnedEntityId } from '../auth/ownership';
import { CrudRepository } from './repository';
import { mapPrismaError } from './prisma-error';
import { HttpError, NotFoundError } from './http-error';
import { Actor, ResourceConfig, WriteProtection } from './types';

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

  /** Enforces `protection.ownerField` against `record` for non-admin actors. No-op if unset. */
  private async enforceOwnership(
    protection: WriteProtection | undefined,
    actor: Actor | undefined,
    record: unknown,
  ): Promise<void> {
    if (!protection?.ownerField || !actor || actor.role === 'admin') return;

    const ownedId = await resolveOwnedEntityId(actor);
    if (ownedId === null) throw new HttpError(403, 'No linked profile for this account');

    const recordValue = (record as Record<string, unknown>)[protection.ownerField];
    if (recordValue !== ownedId) {
      throw new HttpError(403, 'You do not have permission to modify this resource');
    }
  }

  async getById(idParams: Record<string, string>): Promise<T> {
    const record = await this.repository.findById(idParams);
    if (!record) throw new NotFoundError(`${this.config.name} not found`);
    return record;
  }

  async create(data: TCreate, actor?: Actor): Promise<T> {
    await this.enforceOwnership(this.config.protect?.create, actor, data);
    try {
      return await this.repository.create(data);
    } catch (err) {
      mapPrismaError(err, this.config.name);
    }
  }

  async update(idParams: Record<string, string>, data: TUpdate, actor?: Actor): Promise<T> {
    if (this.config.protect?.update?.ownerField) {
      const existing = await this.getById(idParams);
      await this.enforceOwnership(this.config.protect.update, actor, existing);
    }
    try {
      return await this.repository.update(idParams, data);
    } catch (err) {
      mapPrismaError(err, this.config.name);
    }
  }

  async remove(idParams: Record<string, string>, actor?: Actor): Promise<T> {
    if (this.config.protect?.remove?.ownerField) {
      const existing = await this.getById(idParams);
      await this.enforceOwnership(this.config.protect.remove, actor, existing);
    }
    try {
      return await this.repository.remove(idParams);
    } catch (err) {
      mapPrismaError(err, this.config.name);
    }
  }
}
