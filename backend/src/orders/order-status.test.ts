import { describe, expect, it } from 'vitest';
import { canTransitionDelivery, canTransitionOrder, orderStatusForDelivery } from './order-status';

describe('canTransitionOrder', () => {
  it('allows the documented happy path', () => {
    expect(canTransitionOrder('placed', 'accepted')).toBe(true);
    expect(canTransitionOrder('accepted', 'preparing')).toBe(true);
    expect(canTransitionOrder('preparing', 'out_for_delivery')).toBe(true);
    expect(canTransitionOrder('out_for_delivery', 'delivered')).toBe(true);
  });

  it('allows cancellation from any pre-dispatch state', () => {
    expect(canTransitionOrder('placed', 'cancelled')).toBe(true);
    expect(canTransitionOrder('accepted', 'cancelled')).toBe(true);
    expect(canTransitionOrder('preparing', 'cancelled')).toBe(true);
  });

  it('rejects skipping ahead', () => {
    expect(canTransitionOrder('placed', 'preparing')).toBe(false);
    expect(canTransitionOrder('placed', 'delivered')).toBe(false);
    expect(canTransitionOrder('accepted', 'out_for_delivery')).toBe(false);
  });

  it('rejects moving backwards', () => {
    expect(canTransitionOrder('preparing', 'accepted')).toBe(false);
    expect(canTransitionOrder('delivered', 'out_for_delivery')).toBe(false);
  });

  it('treats delivered and cancelled as terminal', () => {
    expect(canTransitionOrder('delivered', 'cancelled')).toBe(false);
    expect(canTransitionOrder('cancelled', 'placed')).toBe(false);
    expect(canTransitionOrder('delivered', 'placed')).toBe(false);
  });
});

describe('canTransitionDelivery', () => {
  it('allows the documented happy path', () => {
    expect(canTransitionDelivery('assigned', 'picked_up')).toBe(true);
    expect(canTransitionDelivery('picked_up', 'in_transit')).toBe(true);
    expect(canTransitionDelivery('in_transit', 'delivered')).toBe(true);
  });

  it('allows failure from any active state', () => {
    expect(canTransitionDelivery('assigned', 'failed')).toBe(true);
    expect(canTransitionDelivery('picked_up', 'failed')).toBe(true);
    expect(canTransitionDelivery('in_transit', 'failed')).toBe(true);
  });

  it('rejects skipping ahead', () => {
    expect(canTransitionDelivery('assigned', 'in_transit')).toBe(false);
    expect(canTransitionDelivery('assigned', 'delivered')).toBe(false);
  });

  it('treats delivered and failed as terminal', () => {
    expect(canTransitionDelivery('delivered', 'assigned')).toBe(false);
    expect(canTransitionDelivery('failed', 'picked_up')).toBe(false);
  });
});

describe('orderStatusForDelivery', () => {
  it('maps picked_up and in_transit to out_for_delivery', () => {
    expect(orderStatusForDelivery('picked_up')).toBe('out_for_delivery');
    expect(orderStatusForDelivery('in_transit')).toBe('out_for_delivery');
  });

  it('maps delivered to delivered', () => {
    expect(orderStatusForDelivery('delivered')).toBe('delivered');
  });

  it('has no order-status opinion on assigned or failed', () => {
    expect(orderStatusForDelivery('assigned')).toBeNull();
    expect(orderStatusForDelivery('failed')).toBeNull();
  });
});
