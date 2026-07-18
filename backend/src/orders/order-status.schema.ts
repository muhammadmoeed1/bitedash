import { z } from 'zod';
import { ORDER_STATUSES } from './order-status';

export const orderStatusBodySchema = z.object({ status: z.enum(ORDER_STATUSES) });
export type OrderStatusInput = z.infer<typeof orderStatusBodySchema>;
