import { z } from 'zod';

export const checkoutSchema = z.object({
  items: z
    .array(
      z.object({
        item_id: z.coerce.number().int().positive(),
        quantity: z.coerce.number().int().positive().max(50),
      }),
    )
    .min(1, 'At least one item is required')
    .max(50),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
