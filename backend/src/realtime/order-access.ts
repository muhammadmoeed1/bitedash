import { prisma } from '../lib/prisma';
import { resolveOwnedEntityId } from '../auth/ownership';
import { Actor } from '../core/types';

/**
 * Whether an actor is allowed to watch a given order's real-time channel:
 * the customer who placed it, a restaurant owner with an item on it, the assigned
 * delivery agent, or an admin.
 */
export async function canAccessOrder(actor: Actor, orderId: number): Promise<boolean> {
  if (actor.role === 'admin') return true;

  const order = await prisma.orders.findUnique({
    where: { order_id: orderId },
    include: { order_items: { include: { menu_items: true } }, deliveries: true },
  });
  if (!order) return false;

  const ownedId = await resolveOwnedEntityId(actor);
  if (ownedId === null) return false;

  switch (actor.role) {
    case 'customer':
      return order.customer_id === ownedId;
    case 'restaurant_owner':
      return order.order_items.some((item) => item.menu_items?.restaurant_id === ownedId);
    case 'delivery_agent':
      return order.deliveries.some((d) => d.agent_id === ownedId);
    default:
      return false;
  }
}

/** The order a delivery belongs to, plus whether the actor (agent/admin) may push its location. */
export async function resolveDeliveryForLocation(
  actor: Actor,
  deliveryId: number,
): Promise<{ orderId: number | null } | null> {
  const delivery = await prisma.deliveries.findUnique({ where: { delivery_id: deliveryId } });
  if (!delivery) return null;

  if (actor.role === 'admin') return { orderId: delivery.order_id };
  if (actor.role !== 'delivery_agent') return null;

  const ownedId = await resolveOwnedEntityId(actor);
  if (ownedId === null || delivery.agent_id !== ownedId) return null;

  return { orderId: delivery.order_id };
}
