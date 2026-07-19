import { prisma } from '../lib/prisma';
import { HttpError, NotFoundError } from '../core/http-error';
import { resolveOwnedEntityId } from '../auth/ownership';
import { Actor } from '../core/types';
import { requireStripe } from './stripe-client';

export interface PaymentIntentResult {
  clientSecret: string | null;
  paymentId: number;
}

/**
 * Creates (or, if one is already pending, reuses) a Stripe PaymentIntent for an order's
 * total amount. Idempotent by design — calling this twice for the same unpaid order
 * returns the same client secret rather than creating a duplicate charge.
 */
export async function createPaymentIntentForOrder(
  actor: Actor,
  orderId: number,
): Promise<PaymentIntentResult> {
  // Validate business rules and ownership before touching Stripe, so a misconfigured/missing
  // API key doesn't mask an otherwise-invalid request (and so these rules stay testable
  // without live Stripe keys).
  const order = await prisma.orders.findUnique({ where: { order_id: orderId } });
  if (!order) throw new NotFoundError('order not found');

  if (actor.role !== 'admin') {
    if (actor.role !== 'customer') throw new HttpError(403, 'Only the customer can pay for an order');
    const ownedId = await resolveOwnedEntityId(actor);
    if (order.customer_id !== ownedId) throw new HttpError(403, 'This is not your order');
  }

  if (order.status === 'cancelled') throw new HttpError(409, 'Cannot pay for a cancelled order');

  const existing = await prisma.payments.findFirst({
    where: { order_id: orderId, payment_status: { in: ['pending', 'completed'] } },
    orderBy: { payment_id: 'desc' },
  });

  if (existing?.payment_status === 'completed') {
    throw new HttpError(409, 'This order has already been paid');
  }

  const amount = Math.round(Number(order.total_amount ?? 0) * 100);
  if (amount <= 0) throw new HttpError(422, 'Order has no payable amount');

  const stripe = requireStripe();

  if (existing?.stripe_payment_intent_id) {
    const intent = await stripe.paymentIntents.retrieve(existing.stripe_payment_intent_id);
    return { clientSecret: intent.client_secret, paymentId: existing.payment_id };
  }

  const intent = await stripe.paymentIntents.create({
    amount,
    currency: 'usd',
    metadata: { order_id: String(orderId) },
    automatic_payment_methods: { enabled: true },
  });

  const payment = await prisma.payments.create({
    data: {
      order_id: orderId,
      amount: order.total_amount,
      payment_method: 'card',
      payment_status: 'pending',
      stripe_payment_intent_id: intent.id,
    },
  });

  return { clientSecret: intent.client_secret, paymentId: payment.payment_id };
}
