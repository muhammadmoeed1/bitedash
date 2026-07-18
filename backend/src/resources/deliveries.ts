import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { createCrudRouter } from '../core/router';
import { PrismaDelegate, ResourceConfig } from '../core/types';
import { DELIVERY_STATUSES } from '../orders/order-status';
import type { deliveriesModel } from '../generated/prisma/models/deliveries';

const createSchema = z.object({
  order_id: z.coerce.number().int().positive(),
  agent_id: z.coerce.number().int().positive(),
  delivery_status: z.enum(DELIVERY_STATUSES).default('assigned'),
  delivery_time: z
    .string()
    .regex(/^\d{2}:\d{2}(:\d{2})?$/, 'delivery_time must be in HH:MM or HH:MM:SS format')
    .optional(),
});

// Status is intentionally excluded from generic updates — lifecycle changes must go through
// PATCH /api/v1/deliveries/:delivery_id/status, which enforces the delivery state machine
// and syncs the parent order's status.
const updateSchema = createSchema.omit({ delivery_status: true }).partial();

export type DeliveryCreate = z.infer<typeof createSchema>;
export type DeliveryUpdate = z.infer<typeof updateSchema>;

const config: ResourceConfig<deliveriesModel, DeliveryCreate, DeliveryUpdate> = {
  name: 'delivery',
  path: 'deliveries',
  delegate: prisma.deliveries as unknown as PrismaDelegate<deliveriesModel>,
  primaryKey: 'delivery_id',
  createSchema,
  updateSchema,
  filterableFields: ['order_id', 'agent_id', 'delivery_status'],
  sortableFields: ['delivery_id'],
  defaultSort: { delivery_id: 'desc' },
  protect: {
    // Dispatch (assigning an agent to an order) is admin-controlled.
    create: { roles: ['admin'] },
    // Non-status fields only — admin-only; agents update status via the dedicated endpoint.
    update: { roles: ['admin'] },
    remove: { roles: ['admin'] },
  },
};

export const deliveriesRouter = createCrudRouter<deliveriesModel, DeliveryCreate, DeliveryUpdate>(config);
