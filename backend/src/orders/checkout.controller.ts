import { Request, Response } from 'express';
import { validate } from '../utils/validate';
import { HttpError } from '../core/http-error';
import { checkoutSchema } from './checkout.schema';
import { checkout } from './checkout.service';

export const checkoutController = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) throw new HttpError(401, 'Not authenticated');
  const payload = validate(checkoutSchema, req.body);
  const order = await checkout(req.user, payload);
  res.status(201).json({ data: order });
};
