import { Request, Response } from 'express';
import { validate } from '../utils/validate';
import { HttpError } from '../core/http-error';
import { orderStatusBodySchema } from './order-status.schema';
import { updateOrderStatus } from './order-status.service';

export const orderStatusController = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) throw new HttpError(401, 'Not authenticated');
  const { status } = validate(orderStatusBodySchema, req.body);
  const orderId = Number(req.params.order_id);
  const order = await updateOrderStatus(req.user, orderId, status);
  res.json({ data: order });
};
