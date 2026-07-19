import { prisma } from '../lib/prisma';
import { HttpError, NotFoundError } from '../core/http-error';
import { resolveOwnedEntityId } from '../auth/ownership';
import { Actor } from '../core/types';
import { emitDeliveryStatus, emitOrderStatus } from '../realtime/events';
import {
  canTransitionDelivery,
  canTransitionOrder,
  DeliveryStatus,
  orderStatusForDelivery,
  OrderStatus,
} from './order-status';

export async function updateDeliveryStatus(actor: Actor, deliveryId: number, nextStatus: DeliveryStatus) {
  const delivery = await prisma.deliveries.findUnique({ where: { delivery_id: deliveryId } });
  if (!delivery) throw new NotFoundError('delivery not found');

  if (actor.role !== 'admin') {
    if (actor.role !== 'delivery_agent') {
      throw new HttpError(403, 'Only the assigned delivery agent can update this delivery');
    }
    const ownedId = await resolveOwnedEntityId(actor);
    if (delivery.agent_id !== ownedId) {
      throw new HttpError(403, 'This delivery is not assigned to you');
    }
  }

  const currentStatus = (delivery.delivery_status ?? 'assigned') as DeliveryStatus;
  if (!canTransitionDelivery(currentStatus, nextStatus)) {
    throw new HttpError(409, `Cannot transition delivery from "${currentStatus}" to "${nextStatus}"`);
  }

  const updated = await prisma.deliveries.update({
    where: { delivery_id: deliveryId },
    data: { delivery_status: nextStatus },
  });
  emitDeliveryStatus({ delivery_id: deliveryId, order_id: delivery.order_id, status: nextStatus });

  // Propagate to the parent order's lifecycle where applicable (e.g. delivered -> delivered).
  const syncedStatus = orderStatusForDelivery(nextStatus);
  if (syncedStatus && delivery.order_id) {
    const order = await prisma.orders.findUnique({ where: { order_id: delivery.order_id } });
    const currentOrderStatus = (order?.status ?? 'placed') as OrderStatus;
    if (order && canTransitionOrder(currentOrderStatus, syncedStatus)) {
      await prisma.orders.update({ where: { order_id: delivery.order_id }, data: { status: syncedStatus } });
      emitOrderStatus({ order_id: delivery.order_id, status: syncedStatus });
    }
  }

  return updated;
}
