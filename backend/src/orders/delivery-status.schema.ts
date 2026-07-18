import { z } from 'zod';
import { DELIVERY_STATUSES } from './order-status';

export const deliveryStatusBodySchema = z.object({ status: z.enum(DELIVERY_STATUSES) });
export type DeliveryStatusInput = z.infer<typeof deliveryStatusBodySchema>;
