import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { createCrudRouter } from '../core/router';
import { PrismaDelegate, ResourceConfig } from '../core/types';
import type { deliveriesModel } from '../generated/prisma/models/deliveries';

const DELIVERY_STATUSES = ['assigned', 'picked_up', 'in_transit', 'delivered', 'failed'] as const;

const createSchema = z.object({
  order_id: z.coerce.number().int().positive(),
  agent_id: z.coerce.number().int().positive(),
  delivery_status: z.enum(DELIVERY_STATUSES).default('assigned'),
  delivery_time: z
    .string()
    .regex(/^\d{2}:\d{2}(:\d{2})?$/, 'delivery_time must be in HH:MM or HH:MM:SS format')
    .optional(),
});

const updateSchema = createSchema.partial();

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
};

export const deliveriesRouter = createCrudRouter<deliveriesModel, DeliveryCreate, DeliveryUpdate>(config);
