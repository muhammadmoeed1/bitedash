import { beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { CrudRepository } from './repository';
import { CrudService } from './service';
import { ResourceConfig } from './types';

vi.mock('../auth/ownership', () => ({
  resolveOwnedEntityId: vi.fn(),
}));
import { resolveOwnedEntityId } from '../auth/ownership';

interface Widget {
  widget_id: number;
  owner_id: number;
  name: string;
  category: string;
}

/** A minimal in-memory stand-in for a Prisma model delegate — no DB, fully deterministic. */
function createFakeDelegate(seed: Widget[]) {
  const rows: Widget[] = seed.map((r) => ({ ...r }));
  let nextId = rows.length ? Math.max(...rows.map((r) => r.widget_id)) + 1 : 1;

  function matches(row: Widget, where?: Record<string, unknown>): boolean {
    if (!where) return true;
    return Object.entries(where).every(([key, value]) => {
      if (key === 'OR' && Array.isArray(value)) {
        return value.some((cond) => matches(row, cond as Record<string, unknown>));
      }
      if (value && typeof value === 'object' && 'contains' in (value as Record<string, unknown>)) {
        const needle = String((value as { contains: string }).contains).toLowerCase();
        return String((row as unknown as Record<string, unknown>)[key] ?? '')
          .toLowerCase()
          .includes(needle);
      }
      return (row as unknown as Record<string, unknown>)[key] === value;
    });
  }

  return {
    async findMany(
      args: {
        where?: Record<string, unknown>;
        orderBy?: Record<string, 'asc' | 'desc'>;
        skip?: number;
        take?: number;
      } = {},
    ) {
      let result = rows.filter((r) => matches(r, args.where));
      if (args.orderBy) {
        const [field, dir] = Object.entries(args.orderBy)[0] as [keyof Widget, 'asc' | 'desc'];
        result = [...result].sort((a, b) => {
          const cmp = a[field] > b[field] ? 1 : a[field] < b[field] ? -1 : 0;
          return dir === 'desc' ? -cmp : cmp;
        });
      }
      if (args.skip) result = result.slice(args.skip);
      if (args.take !== undefined) result = result.slice(0, args.take);
      return result;
    },
    async count(args: { where?: Record<string, unknown> } = {}) {
      return rows.filter((r) => matches(r, args.where)).length;
    },
    async findUnique(args: { where: Record<string, unknown> }) {
      return rows.find((r) => matches(r, args.where)) ?? null;
    },
    async create(args: { data: Omit<Widget, 'widget_id'> }) {
      const row = { widget_id: nextId++, ...args.data } as Widget;
      rows.push(row);
      return row;
    },
    async update(args: { where: Record<string, unknown>; data: Partial<Widget> }) {
      const idx = rows.findIndex((r) => matches(r, args.where));
      if (idx === -1) throw new Error('fake delegate: no row matched update where clause');
      rows[idx] = { ...rows[idx], ...args.data };
      return rows[idx];
    },
    async delete(args: { where: Record<string, unknown> }) {
      const idx = rows.findIndex((r) => matches(r, args.where));
      if (idx === -1) throw new Error('fake delegate: no row matched delete where clause');
      const [removed] = rows.splice(idx, 1);
      return removed;
    },
  };
}

function buildService(
  seed: Widget[],
  configOverrides: Partial<ResourceConfig<Widget, Partial<Widget>, Partial<Widget>>> = {},
) {
  const delegate = createFakeDelegate(seed);
  const config: ResourceConfig<Widget, Partial<Widget>, Partial<Widget>> = {
    name: 'widget',
    path: 'widgets',
    delegate,
    primaryKey: 'widget_id',
    createSchema: z.object({}).passthrough() as z.ZodType<Partial<Widget>>,
    updateSchema: z.object({}).passthrough() as z.ZodType<Partial<Widget>>,
    filterableFields: ['owner_id', 'category'],
    searchableFields: ['name'],
    sortableFields: ['widget_id', 'name'],
    defaultSort: { widget_id: 'asc' },
    ...configOverrides,
  };
  const repository = new CrudRepository<Widget>(delegate, config.primaryKey);
  return new CrudService<Widget, Partial<Widget>, Partial<Widget>>(repository, config);
}

const SEED: Widget[] = [
  { widget_id: 1, owner_id: 10, name: 'Red Gadget', category: 'gadgets' },
  { widget_id: 2, owner_id: 10, name: 'Blue Gadget', category: 'gadgets' },
  { widget_id: 3, owner_id: 20, name: 'Green Gizmo', category: 'gizmos' },
];

beforeEach(() => {
  vi.mocked(resolveOwnedEntityId).mockReset();
});

describe('CrudService.list', () => {
  it('paginates and reports accurate meta', async () => {
    const service = buildService(SEED);
    const result = await service.list({ page: 1, pageSize: 2, filters: {} });
    expect(result.data).toHaveLength(2);
    expect(result.meta).toEqual({ total: 3, page: 1, pageSize: 2, totalPages: 2 });
  });

  it('filters by an allow-listed field', async () => {
    const service = buildService(SEED);
    const result = await service.list({ page: 1, pageSize: 10, filters: { owner_id: 10 } });
    expect(result.data.map((w) => w.widget_id)).toEqual([1, 2]);
  });

  it('searches allow-listed text fields case-insensitively', async () => {
    const service = buildService(SEED);
    const result = await service.list({ page: 1, pageSize: 10, filters: {}, search: 'green' });
    expect(result.data.map((w) => w.widget_id)).toEqual([3]);
  });

  it('sorts by an allow-listed field and direction', async () => {
    const service = buildService(SEED);
    const result = await service.list({
      page: 1,
      pageSize: 10,
      filters: {},
      sortField: 'name',
      sortDirection: 'desc',
    });
    expect(result.data.map((w) => w.name)).toEqual(['Red Gadget', 'Green Gizmo', 'Blue Gadget']);
  });

  it('falls back to defaultSort for a non-allow-listed sort field', async () => {
    const service = buildService(SEED);
    const result = await service.list({ page: 1, pageSize: 10, filters: {}, sortField: 'category' });
    // 'category' isn't in sortableFields, so it silently falls back to defaultSort (widget_id asc).
    expect(result.data.map((w) => w.widget_id)).toEqual([1, 2, 3]);
  });
});

describe('CrudService.getById', () => {
  it('returns the matching record', async () => {
    const service = buildService(SEED);
    const record = await service.getById({ widget_id: '2' });
    expect(record.name).toBe('Blue Gadget');
  });

  it('throws NotFoundError for a missing id', async () => {
    const service = buildService(SEED);
    await expect(service.getById({ widget_id: '999' })).rejects.toThrow('widget not found');
  });
});

describe('CrudService ownership enforcement', () => {
  it('allows create when the payload owner matches the actor', async () => {
    vi.mocked(resolveOwnedEntityId).mockResolvedValue(10);
    const service = buildService(SEED, {
      protect: { create: { roles: ['customer'], ownerField: 'owner_id' } },
    });
    const created = await service.create(
      { owner_id: 10, name: 'New', category: 'gadgets' },
      {
        userId: 1,
        role: 'customer',
      },
    );
    expect(created.owner_id).toBe(10);
  });

  it('rejects create when the payload owner does not match the actor', async () => {
    vi.mocked(resolveOwnedEntityId).mockResolvedValue(10);
    const service = buildService(SEED, {
      protect: { create: { roles: ['customer'], ownerField: 'owner_id' } },
    });
    await expect(
      service.create({ owner_id: 20, name: 'Sneaky', category: 'gadgets' }, { userId: 1, role: 'customer' }),
    ).rejects.toThrow('You do not have permission');
  });

  it('lets admins bypass ownership checks entirely', async () => {
    // resolveOwnedEntityId is never even consulted for admins.
    const service = buildService(SEED, { protect: { create: { roles: ['admin'], ownerField: 'owner_id' } } });
    const created = await service.create(
      { owner_id: 999, name: 'Admin add', category: 'gadgets' },
      {
        userId: 1,
        role: 'admin',
      },
    );
    expect(created.owner_id).toBe(999);
    expect(resolveOwnedEntityId).not.toHaveBeenCalled();
  });

  it('rejects update on a row the actor does not own', async () => {
    vi.mocked(resolveOwnedEntityId).mockResolvedValue(20); // actor "owns" widget 3, not widget 1
    const service = buildService(SEED, {
      protect: { update: { roles: ['customer'], ownerField: 'owner_id' } },
    });
    await expect(
      service.update({ widget_id: '1' }, { name: 'Hacked' }, { userId: 1, role: 'customer' }),
    ).rejects.toThrow('You do not have permission');
  });

  it('allows update on a row the actor owns', async () => {
    vi.mocked(resolveOwnedEntityId).mockResolvedValue(10);
    const service = buildService(SEED, {
      protect: { update: { roles: ['customer'], ownerField: 'owner_id' } },
    });
    const updated = await service.update(
      { widget_id: '1' },
      { name: 'Renamed' },
      { userId: 1, role: 'customer' },
    );
    expect(updated.name).toBe('Renamed');
  });
});

describe('CrudService business-rule hooks', () => {
  it('runs beforeCreate and blocks the write when it throws', async () => {
    const service = buildService(SEED, {
      hooks: {
        beforeCreate: async () => {
          throw new Error('business rule violated');
        },
      },
    });
    await expect(service.create({ owner_id: 10, name: 'X', category: 'gadgets' })).rejects.toThrow(
      'business rule violated',
    );
  });
});
