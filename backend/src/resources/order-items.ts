import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { createCrudRouter } from '../core/router';
import { PrismaDelegate, ResourceConfig } from '../core/types';
import type { order_itemsModel } from '../generated/prisma/models/order_items';

const createSchema = z.object({
  order_id: z.coerce.number().int().positive(),
  item_id: z.coerce.number().int().positive(),
  quantity: z.coerce.number().int().positive(),
  price: z.coerce.number().positive(),
});

const updateSchema = createSchema.partial();

export type OrderItemCreate = z.infer<typeof createSchema>;
export type OrderItemUpdate = z.infer<typeof updateSchema>;

const config: ResourceConfig<order_itemsModel, OrderItemCreate, OrderItemUpdate> = {
  name: 'order item',
  path: 'order-items',
  delegate: prisma.order_items as unknown as PrismaDelegate<order_itemsModel>,
  primaryKey: 'order_item_id',
  createSchema,
  updateSchema,
  filterableFields: ['order_id', 'item_id'],
  sortableFields: ['order_item_id'],
  defaultSort: { order_item_id: 'asc' },
  protect: {
    // NOTE: role-gated only (no per-row ownerField) — order_items has no customer_id of its
    // own to check against; verifying it belongs to the caller's own order requires a join
    // that the generic ownership check doesn't support yet. Revisit once order placement
    // becomes a dedicated transactional endpoint (roadmap Phase 3), which will make raw
    // writes to this resource largely internal anyway.
    create: { roles: ['customer', 'admin'] },
    update: { roles: ['customer', 'admin'] },
    remove: { roles: ['customer', 'admin'] },
  },
};

export const orderItemsRouter = createCrudRouter<order_itemsModel, OrderItemCreate, OrderItemUpdate>(config);
