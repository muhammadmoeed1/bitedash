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
};

export const orderItemsRouter = createCrudRouter<order_itemsModel, OrderItemCreate, OrderItemUpdate>(config);
