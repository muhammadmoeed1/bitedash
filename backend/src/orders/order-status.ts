export const ORDER_STATUSES = ['placed', 'accepted', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

/** Legal next states for each order status. Terminal states (delivered/cancelled) have none. */
const ORDER_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  placed: ['accepted', 'cancelled'],
  accepted: ['preparing', 'cancelled'],
  preparing: ['out_for_delivery', 'cancelled'],
  out_for_delivery: ['delivered'],
  delivered: [],
  cancelled: [],
};

export function canTransitionOrder(from: OrderStatus, to: OrderStatus): boolean {
  return ORDER_TRANSITIONS[from]?.includes(to) ?? false;
}

export const DELIVERY_STATUSES = ['assigned', 'picked_up', 'in_transit', 'delivered', 'failed'] as const;
export type DeliveryStatus = (typeof DELIVERY_STATUSES)[number];

const DELIVERY_TRANSITIONS: Record<DeliveryStatus, readonly DeliveryStatus[]> = {
  assigned: ['picked_up', 'failed'],
  picked_up: ['in_transit', 'failed'],
  in_transit: ['delivered', 'failed'],
  delivered: [],
  failed: [],
};

export function canTransitionDelivery(from: DeliveryStatus, to: DeliveryStatus): boolean {
  return DELIVERY_TRANSITIONS[from]?.includes(to) ?? false;
}

/** The order status a delivery status change should propagate to, if any. */
export function orderStatusForDelivery(deliveryStatus: DeliveryStatus): OrderStatus | null {
  switch (deliveryStatus) {
    case 'picked_up':
    case 'in_transit':
      return 'out_for_delivery';
    case 'delivered':
      return 'delivered';
    default:
      return null;
  }
}
