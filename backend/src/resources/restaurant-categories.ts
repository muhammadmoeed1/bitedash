import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { createCrudRouter } from '../core/router';
import { PrismaDelegate, ResourceConfig } from '../core/types';
import type { restaurant_categoriesModel } from '../generated/prisma/models/restaurant_categories';

const createSchema = z.object({
  restaurant_id: z.coerce.number().int().positive(),
  category_id: z.coerce.number().int().positive(),
});

// Junction table has no fields beyond its composite key, so there is nothing meaningful to PATCH.
const updateSchema = z.object({});

export type RestaurantCategoryCreate = z.infer<typeof createSchema>;
export type RestaurantCategoryUpdate = z.infer<typeof updateSchema>;

const config: ResourceConfig<restaurant_categoriesModel, RestaurantCategoryCreate, RestaurantCategoryUpdate> = {
  name: 'restaurant category link',
  path: 'restaurant-categories',
  delegate: prisma.restaurant_categories as unknown as PrismaDelegate<restaurant_categoriesModel>,
  primaryKey: ['restaurant_id', 'category_id'],
  createSchema,
  updateSchema,
  filterableFields: ['restaurant_id', 'category_id'],
  sortableFields: [],
};

export const restaurantCategoriesRouter = createCrudRouter<
  restaurant_categoriesModel,
  RestaurantCategoryCreate,
  RestaurantCategoryUpdate
>(config);
