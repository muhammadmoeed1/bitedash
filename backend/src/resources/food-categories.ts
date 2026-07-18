import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { createCrudRouter } from '../core/router';
import { PrismaDelegate, ResourceConfig } from '../core/types';
import type { food_categoriesModel } from '../generated/prisma/models/food_categories';

const createSchema = z.object({
  category_name: z.string().trim().min(1).max(100),
});

const updateSchema = createSchema.partial();

export type FoodCategoryCreate = z.infer<typeof createSchema>;
export type FoodCategoryUpdate = z.infer<typeof updateSchema>;

const config: ResourceConfig<food_categoriesModel, FoodCategoryCreate, FoodCategoryUpdate> = {
  name: 'food category',
  path: 'food-categories',
  delegate: prisma.food_categories as unknown as PrismaDelegate<food_categoriesModel>,
  primaryKey: 'category_id',
  createSchema,
  updateSchema,
  filterableFields: [],
  sortableFields: ['category_id', 'category_name'],
  defaultSort: { category_id: 'asc' },
};

export const foodCategoriesRouter = createCrudRouter<food_categoriesModel, FoodCategoryCreate, FoodCategoryUpdate>(
  config,
);
