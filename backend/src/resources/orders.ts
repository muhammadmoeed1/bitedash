import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { createCrudRouter } from '../core/router';
import { PrismaDelegate, ResourceConfig } from '../core/types';
import { ORDER_STATUSES } from '../orders/order-status';
import type { ordersModel } from '../generated/prisma/models/orders';

const createSchema = z.object({
  customer_id: z.coerce.number().int().positive(),
  status: z.enum(ORDER_STATUSES).default('placed'),
  total_amount: z.coerce.number().nonnegative().optional(),
});

// Status is intentionally excluded from generic updates — lifecycle changes must go through
// PATCH /api/v1/orders/:order_id/status, which enforces the order state machine.
const updateSchema = createSchema.omit({ status: true }).partial();

export type OrderCreate = z.infer<typeof createSchema>;
export type OrderUpdate = z.infer<typeof updateSchema>;

export const config: ResourceConfig<ordersModel, OrderCreate, OrderUpdate> = {
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
    // Real order placement should go through POST /api/v1/orders/checkout, which validates
    // prices/availability server-side; this generic create is kept for admin/testing use.
    create: { roles: ['customer', 'admin'], ownerField: 'customer_id' },
    // Non-status fields only — admin-only, since customers/restaurants have no legitimate
    // reason to edit an order's customer_id/total_amount after placement.
    update: { roles: ['admin'] },
    remove: { roles: ['admin'] },
  },
};

export const ordersRouter = createCrudRouter<ordersModel, OrderCreate, OrderUpdate>(config);
