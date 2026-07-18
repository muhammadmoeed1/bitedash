import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { createCrudRouter } from '../core/router';
import { HttpError } from '../core/http-error';
import { PrismaDelegate, ResourceConfig } from '../core/types';
import type { reviewsModel } from '../generated/prisma/models/reviews';

const createSchema = z.object({
  customer_id: z.coerce.number().int().positive(),
  restaurant_id: z.coerce.number().int().positive(),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().trim().max(1000).optional(),
});

const updateSchema = createSchema.partial();

export type ReviewCreate = z.infer<typeof createSchema>;
export type ReviewUpdate = z.infer<typeof updateSchema>;

const config: ResourceConfig<reviewsModel, ReviewCreate, ReviewUpdate> = {
  name: 'review',
  path: 'reviews',
  delegate: prisma.reviews as unknown as PrismaDelegate<reviewsModel>,
  primaryKey: 'review_id',
  createSchema,
  updateSchema,
  filterableFields: ['customer_id', 'restaurant_id'],
  sortableFields: ['review_id', 'rating'],
  defaultSort: { review_id: 'desc' },
  protect: {
    create: { roles: ['customer', 'admin'], ownerField: 'customer_id' },
    update: { roles: ['customer', 'admin'], ownerField: 'customer_id' },
    remove: { roles: ['customer', 'admin'], ownerField: 'customer_id' },
  },
  hooks: {
    // A customer may only review a restaurant they've actually had a completed order from.
    beforeCreate: async (data, actor) => {
      if (actor?.role === 'admin') return;
      const { customer_id, restaurant_id } = data as ReviewCreate;
      const deliveredOrder = await prisma.orders.findFirst({
        where: {
          customer_id,
          status: 'delivered',
          order_items: { some: { menu_items: { restaurant_id } } },
        },
      });
      if (!deliveredOrder) {
        throw new HttpError(422, 'You can only review a restaurant after a delivered order from them');
      }
    },
  },
};

export const reviewsRouter = createCrudRouter<reviewsModel, ReviewCreate, ReviewUpdate>(config);
