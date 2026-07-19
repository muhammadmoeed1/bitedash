import { prisma } from '../lib/prisma';
import { HttpError, NotFoundError } from '../core/http-error';
import { requireStripe } from './stripe-client';

export async function refundPayment(paymentId: number) {
  // Validate before touching Stripe, so an unconfigured key doesn't mask an invalid request.
  const payment = await prisma.payments.findUnique({ where: { payment_id: paymentId } });
  if (!payment) throw new NotFoundError('payment not found');
  if (!payment.stripe_payment_intent_id) throw new HttpError(422, 'This payment was not made via Stripe');
  if (payment.payment_status !== 'completed')
    throw new HttpError(409, 'Only a completed payment can be refunded');

  const stripe = requireStripe();
  await stripe.refunds.create({ payment_intent: payment.stripe_payment_intent_id });

  return prisma.payments.update({ where: { payment_id: paymentId }, data: { payment_status: 'refunded' } });
}
