import { Request, Response } from 'express';
import { validate } from '../utils/validate';
import { HttpError } from '../core/http-error';
import { createPaymentIntentSchema } from './payment-intent.schema';
import { createPaymentIntentForOrder } from './payment-intent.service';

export const createPaymentIntentController = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) throw new HttpError(401, 'Not authenticated');
  const { order_id } = validate(createPaymentIntentSchema, req.body);
  const result = await createPaymentIntentForOrder(req.user, order_id);
  res.status(201).json({ data: result });
};
