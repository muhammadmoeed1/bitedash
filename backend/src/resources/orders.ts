import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { createCrudRouter } from '../core/router';
import { PrismaDelegate, ResourceConfig } from '../core/types';
import type { ordersModel } from '../generated/prisma/models/orders';

const ORDER_STATUSES = ['placed', 'accepted', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'] as const;

const createSchema = z.object({
  customer_id: z.coerce.number().int().positive(),
  status: z.enum(ORDER_STATUSES).default('placed'),
  total_amount: z.coerce.number().nonnegative().optional(),
});

const updateSchema = createSchema.partial();

export type OrderCreate = z.infer<typeof createSchema>;
export type OrderUpdate = z.infer<typeof updateSchema>;

const config: ResourceConfig<ordersModel, OrderCreate, OrderUpdate> = {
  name: 'order',
  path: 'orders',
  delegate: prisma.orders as unknown as PrismaDelegate<ordersModel>,
  primaryKey: 'order_id',
  createSchema,
  updateSchema,
  filterableFields: ['customer_id', 'status'],
  sortableFields: ['order_id', 'order_date', 'total_amount'],
  defaultSort: { order_id: 'desc' },
  protect: {
    create: { roles: ['customer', 'admin'], ownerField: 'customer_id' },
    // NOTE: real status transitions (restaurant accepts, agent delivers) belong to a
    // dedicated workflow once order placement/fulfillment is built out (see roadmap Phase 3);
    // for now a customer may only update their own order (e.g. to cancel it).
    update: { roles: ['customer', 'admin'], ownerField: 'customer_id' },
    remove: { roles: ['admin'] },
  },
};

export const ordersRouter = createCrudRouter<ordersModel, OrderCreate, OrderUpdate>(config);
