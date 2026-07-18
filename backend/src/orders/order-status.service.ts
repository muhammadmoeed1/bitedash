import { prisma } from '../lib/prisma';
import { HttpError, NotFoundError } from '../core/http-error';
import { resolveOwnedEntityId } from '../auth/ownership';
import { Actor } from '../core/types';
import { emitOrderStatus } from '../realtime/events';
import { canTransitionOrder, OrderStatus } from './order-status';

/** Target statuses each non-admin role may request via PATCH /orders/:order_id/status. */
const ROLE_ALLOWED_TARGETS: Partial<Record<Actor['role'], readonly OrderStatus[]>> = {
  customer: ['cancelled'],
  restaurant_owner: ['accepted', 'preparing', 'out_for_delivery', 'cancelled'],
};

export async function updateOrderStatus(actor: Actor, orderId: number, nextStatus: OrderStatus) {
  const order = await prisma.orders.findUnique({
    where: { order_id: orderId },
    include: { order_items: { include: { menu_items: true } } },
  });
  if (!order) throw new NotFoundError('order not found');

  const currentStatus = (order.status ?? 'placed') as OrderStatus;

  if (actor.role !== 'admin') {
    const allowedTargets = ROLE_ALLOWED_TARGETS[actor.role];
    if (!allowedTargets?.includes(nextStatus)) {
      throw new HttpError(403, `Your role cannot set order status to "${nextStatus}"`);
    }

    const ownedId = await resolveOwnedEntityId(actor);

    if (actor.role === 'customer' && order.customer_id !== ownedId) {
      throw new HttpError(403, 'This is not your order');
    }

    if (actor.role === 'restaurant_owner') {
      const belongsToOwner = order.order_items.some((item) => item.menu_items?.restaurant_id === ownedId);
      if (!belongsToOwner) throw new HttpError(403, 'This order does not belong to your restaurant');
    }
  }

  if (!canTransitionOrder(currentStatus, nextStatus)) {
    throw new HttpError(409, `Cannot transition order from "${currentStatus}" to "${nextStatus}"`);
  }

  const updated = await prisma.orders.update({ where: { order_id: orderId }, data: { status: nextStatus } });
  emitOrderStatus({ order_id: orderId, status: nextStatus });
  return updated;
}
