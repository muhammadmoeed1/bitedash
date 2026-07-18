import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { createCrudRouter } from '../core/router';
import { PrismaDelegate, ResourceConfig } from '../core/types';
import type { menu_itemsModel } from '../generated/prisma/models/menu_items';

const createSchema = z.object({
  restaurant_id: z.coerce.number().int().positive(),
  category_id: z.coerce.number().int().positive().optional(),
  item_name: z.string().trim().min(1).max(100),
  description: z.string().trim().optional(),
  price: z.coerce.number().positive(),
  availability: z.coerce.boolean().optional().default(true),
});

const updateSchema = createSchema.partial();

export type MenuItemCreate = z.infer<typeof createSchema>;
export type MenuItemUpdate = z.infer<typeof updateSchema>;

const config: ResourceConfig<menu_itemsModel, MenuItemCreate, MenuItemUpdate> = {
  name: 'menu item',
  path: 'menu-items',
  delegate: prisma.menu_items as unknown as PrismaDelegate<menu_itemsModel>,
  primaryKey: 'item_id',
  createSchema,
  updateSchema,
  filterableFields: ['restaurant_id', 'category_id', 'availability'],
  sortableFields: ['item_id', 'item_name', 'price'],
  defaultSort: { item_id: 'asc' },
  protect: {
    create: { roles: ['restaurant_owner', 'admin'], ownerField: 'restaurant_id' },
    update: { roles: ['restaurant_owner', 'admin'], ownerField: 'restaurant_id' },
    remove: { roles: ['restaurant_owner', 'admin'], ownerField: 'restaurant_id' },
  },
};

export const menuItemsRouter = createCrudRouter<menu_itemsModel, MenuItemCreate, MenuItemUpdate>(config);
