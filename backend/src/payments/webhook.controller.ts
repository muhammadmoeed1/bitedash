import { Request, Response } from 'express';
import Stripe from 'stripe';
import { prisma } from '../lib/prisma';
import { env } from '../config/env';
import { HttpError } from '../core/http-error';
import { logger } from '../lib/logger';
import { emitPaymentStatus } from '../realtime/events';
import { requireStripe } from './stripe-client';

/** Updates the payment matching a Stripe intent and pushes a live payment:status event. */
async function applyPaymentStatus(intentId: string, status: 'completed' | 'failed'): Promise<void> {
  const payment = await prisma.payments.findUnique({ where: { stripe_payment_intent_id: intentId } });
  if (!payment) return;
  await prisma.payments.update({ where: { payment_id: payment.payment_id }, data: { payment_status: status } });
  emitPaymentStatus({ order_id: payment.order_id, payment_status: status });
}

/**
 * Stripe webhook receiver. Requires the RAW request body (see app.ts, where this route is
 * mounted with express.raw() ahead of the global express.json() middleware) since signature
 * verification hashes the exact bytes Stripe sent.
 */
export const stripeWebhookController = async (req: Request, res: Response): Promise<void> => {
  const stripe = requireStripe();
  if (!env.STRIPE_WEBHOOK_SECRET) throw new HttpError(503, 'Stripe webhook secret not configured');

  const signature = req.headers['stripe-signature'];
  if (!signature || typeof signature !== 'string') {
    throw new HttpError(400, 'Missing Stripe-Signature header');
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(req.body as Buffer, signature, env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    throw new HttpError(400, `Webhook signature verification failed: ${(err as Error).message}`);
  }

  switch (event.type) {
    case 'payment_intent.succeeded': {
      await applyPaymentStatus((event.data.object as Stripe.PaymentIntent).id, 'completed');
      break;
    }
    case 'payment_intent.payment_failed': {
      await applyPaymentStatus((event.data.object as Stripe.PaymentIntent).id, 'failed');
      break;
    }
    default:
      logger.info(`Unhandled Stripe event type: ${event.type}`);
  }

  res.json({ received: true });
};
