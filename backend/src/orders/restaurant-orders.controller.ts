import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { HttpError } from '../core/http-error';

/** Dashboard view: all orders containing at least one item from the given restaurant. */
export const listRestaurantOrders = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) throw new HttpError(401, 'Not authenticated');
  const restaurantId = Number(req.params.restaurant_id);

  if (req.user.role !== 'admin') {
    if (req.user.role !== 'restaurant_owner') {
      throw new HttpError(403, 'Only a restaurant owner can view this dashboard');
    }
    const restaurant = await prisma.restaurants.findUnique({ where: { restaurant_id: restaurantId } });
    if (!restaurant || restaurant.owner_user_id !== req.user.userId) {
      throw new HttpError(403, 'This is not your restaurant');
    }
  }

  const orders = await prisma.orders.findMany({
    where: { order_items: { some: { menu_items: { restaurant_id: restaurantId } } } },
    include: {
      customers: { select: { customer_id: true, name: true, email: true, phone: true } },
      order_items: { include: { menu_items: true } },
      payments: true,
      deliveries: true,
    },
    orderBy: { order_id: 'desc' },
  });

  res.json({ data: orders });
};
