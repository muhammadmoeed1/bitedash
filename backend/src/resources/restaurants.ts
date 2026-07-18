import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { createCrudRouter } from '../core/router';
import { PrismaDelegate, ResourceConfig } from '../core/types';
import type { restaurantsModel } from '../generated/prisma/models/restaurants';

const createSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(100).optional(),
  phone: z.string().trim().max(20).optional(),
  address: z.string().trim().min(1).optional(),
});

const updateSchema = createSchema.partial();

export type RestaurantCreate = z.infer<typeof createSchema>;
export type RestaurantUpdate = z.infer<typeof updateSchema>;

const config: ResourceConfig<restaurantsModel, RestaurantCreate, RestaurantUpdate> = {
  name: 'restaurant',
  path: 'restaurants',
  delegate: prisma.restaurants as unknown as PrismaDelegate<restaurantsModel>,
  primaryKey: 'restaurant_id',
  createSchema,
  updateSchema,
  filterableFields: [],
  sortableFields: ['restaurant_id', 'name'],
  searchableFields: ['name', 'address'],
  defaultSort: { restaurant_id: 'asc' },
  protect: {
    // Onboarding a restaurant normally happens via /api/v1/auth/register (role: restaurant_owner).
    create: { roles: ['admin'] },
    update: { roles: ['restaurant_owner', 'admin'], ownerField: 'restaurant_id' },
    remove: { roles: ['admin'] },
  },
};

export const restaurantsRouter = createCrudRouter<restaurantsModel, RestaurantCreate, RestaurantUpdate>(config);
