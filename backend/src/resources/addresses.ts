import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { createCrudRouter } from '../core/router';
import { PrismaDelegate, ResourceConfig } from '../core/types';
import type { addressesModel } from '../generated/prisma/models/addresses';

const createSchema = z.object({
  customer_id: z.coerce.number().int().positive(),
  street: z.string().trim().min(1).max(255),
  city: z.string().trim().min(1).max(100),
  zip_code: z.string().trim().max(20).optional(),
  label: z.string().trim().max(50).optional(),
});

const updateSchema = createSchema.partial();

export type AddressCreate = z.infer<typeof createSchema>;
export type AddressUpdate = z.infer<typeof updateSchema>;

export const config: ResourceConfig<addressesModel, AddressCreate, AddressUpdate> = {
  name: 'address',
  path: 'addresses',
  delegate: prisma.addresses as unknown as PrismaDelegate<addressesModel>,
  primaryKey: 'address_id',
  createSchema,
  updateSchema,
  filterableFields: ['customer_id'],
  sortableFields: ['address_id'],
  defaultSort: { address_id: 'asc' },
  protect: {
    create: { roles: ['customer', 'admin'], ownerField: 'customer_id' },
    update: { roles: ['customer', 'admin'], ownerField: 'customer_id' },
    remove: { roles: ['customer', 'admin'], ownerField: 'customer_id' },
  },
};

export const addressesRouter = createCrudRouter<addressesModel, AddressCreate, AddressUpdate>(config);
