import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { createCrudRouter } from '../core/router';
import { PrismaDelegate, ResourceConfig } from '../core/types';
import type { customersModel } from '../generated/prisma/models/customers';

const createSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(100),
  phone: z.string().trim().max(20).optional(),
});

const updateSchema = createSchema.partial();

export type CustomerCreate = z.infer<typeof createSchema>;
export type CustomerUpdate = z.infer<typeof updateSchema>;

const config: ResourceConfig<customersModel, CustomerCreate, CustomerUpdate> = {
  name: 'customer',
  path: 'customers',
  delegate: prisma.customers as unknown as PrismaDelegate<customersModel>,
  primaryKey: 'customer_id',
  createSchema,
  updateSchema,
  filterableFields: ['email'],
  sortableFields: ['customer_id', 'name', 'email'],
  defaultSort: { customer_id: 'asc' },
  protect: {
    // Public account creation happens via /api/v1/auth/register; direct creation is admin-only.
    create: { roles: ['admin'] },
    update: { roles: ['customer', 'admin'], ownerField: 'customer_id' },
    remove: { roles: ['admin'] },
  },
};

export const customersRouter = createCrudRouter<customersModel, CustomerCreate, CustomerUpdate>(config);
