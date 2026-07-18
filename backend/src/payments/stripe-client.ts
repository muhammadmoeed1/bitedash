import Stripe from 'stripe';
import { env } from '../config/env';
import { HttpError } from '../core/http-error';

export const stripeClient = env.STRIPE_SECRET_KEY ? new Stripe(env.STRIPE_SECRET_KEY) : null;

/** Throws a clear 503 instead of crashing when the server owner hasn't added Stripe keys yet. */
export function requireStripe(): Stripe {
  if (!stripeClient) {
    throw new HttpError(503, 'Payments are not configured on this server (missing STRIPE_SECRET_KEY)');
  }
  return stripeClient;
}
