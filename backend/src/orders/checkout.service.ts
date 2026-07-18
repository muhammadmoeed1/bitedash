import { prisma } from '../lib/prisma';
import { HttpError } from '../core/http-error';
import { resolveOwnedEntityId } from '../auth/ownership';
import { Actor } from '../core/types';
import { CheckoutInput } from './checkout.schema';

/**
 * Places an order from a cart of {item_id, quantity} pairs. Prices and availability are
 * always re-derived from the database — client-supplied prices/totals are never trusted.
 */
export async function checkout(actor: Actor, input: CheckoutInput) {
  const customerId = await resolveOwnedEntityId(actor);
  if (customerId === null) throw new HttpError(403, 'No linked customer profile for this account');

  const itemIds = input.items.map(({ item_id }) => item_id);
  const menuItems = await prisma.menu_items.findMany({ where: { item_id: { in: itemIds } } });
  const byId = new Map(menuItems.map((item) => [item.item_id, item]));

  const missing = input.items.filter(({ item_id }) => !byId.has(item_id));
  if (missing.length) {
    throw new HttpError(400, `Menu item(s) not found: ${missing.map((i) => i.item_id).join(', ')}`);
  }

  const unavailable = input.items.filter(({ item_id }) => byId.get(item_id)?.availability === false);
  if (unavailable.length) {
    throw new HttpError(
      422,
      `Menu item(s) currently unavailable: ${unavailable.map((i) => i.item_id).join(', ')}`,
    );
  }

  const restaurantIds = new Set(menuItems.map((item) => item.restaurant_id));
  if (restaurantIds.size > 1) {
    throw new HttpError(422, 'All items in a single order must be from the same restaurant');
  }

  const totalAmount = input.items.reduce((sum, { item_id, quantity }) => {
    const price = Number(byId.get(item_id)?.price ?? 0);
    return sum + price * quantity;
  }, 0);

  const order = await prisma.orders.create({
    data: { customer_id: customerId, status: 'placed', total_amount: totalAmount },
  });

  try {
    await prisma.order_items.createMany({
      data: input.items.map(({ item_id, quantity }) => ({
        order_id: order.order_id,
        item_id,
        quantity,
        price: byId.get(item_id)!.price,
      })),
    });
  } catch (err) {
    // No reliable interactive transactions on Neon's pooled connection (see Phase 1/2 notes) —
    // compensate manually by removing the order shell if its line items failed to attach.
    await prisma.orders.delete({ where: { order_id: order.order_id } }).catch(() => undefined);
    throw err;
  }

  return prisma.orders.findUnique({
    where: { order_id: order.order_id },
    include: { order_items: { include: { menu_items: true } } },
  });
}
