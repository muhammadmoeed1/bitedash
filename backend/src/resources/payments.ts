import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { createCrudRouter } from '../core/router';
import { PrismaDelegate, ResourceConfig } from '../core/types';
import type { paymentsModel } from '../generated/prisma/models/payments';

const PAYMENT_METHODS = ['card', 'cash', 'wallet'] as const;
const PAYMENT_STATUSES = ['pending', 'completed', 'failed', 'refunded'] as const;

const createSchema = z.object({
  order_id: z.coerce.number().int().positive(),
  amount: z.coerce.number().positive(),
  payment_method: z.enum(PAYMENT_METHODS),
  payment_status: z.enum(PAYMENT_STATUSES).default('pending'),
});

const updateSchema = createSchema.partial();

export type PaymentCreate = z.infer<typeof createSchema>;
export type PaymentUpdate = z.infer<typeof updateSchema>;

const config: ResourceConfig<paymentsModel, PaymentCreate, PaymentUpdate> = {
  name: 'payment',
  path: 'payments',
  delegate: prisma.payments as unknown as PrismaDelegate<paymentsModel>,
  primaryKey: 'payment_id',
  createSchema,
  updateSchema,
  filterableFields: ['order_id', 'payment_status'],
  sortableFields: ['payment_id', 'payment_date', 'amount'],
  defaultSort: { payment_id: 'desc' },
};

export const paymentsRouter = createCrudRouter<paymentsModel, PaymentCreate, PaymentUpdate>(config);
