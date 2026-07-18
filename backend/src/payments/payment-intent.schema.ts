import { z } from 'zod';

export const createPaymentIntentSchema = z.object({
  order_id: z.coerce.number().int().positive(),
});

export type CreatePaymentIntentInput = z.infer<typeof createPaymentIntentSchema>;
