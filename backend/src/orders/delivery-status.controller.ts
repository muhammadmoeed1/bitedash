import { Request, Response } from 'express';
import { validate } from '../utils/validate';
import { HttpError } from '../core/http-error';
import { deliveryStatusBodySchema } from './delivery-status.schema';
import { updateDeliveryStatus } from './delivery-status.service';

export const deliveryStatusController = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) throw new HttpError(401, 'Not authenticated');
  const { status } = validate(deliveryStatusBodySchema, req.body);
  const deliveryId = Number(req.params.delivery_id);
  const delivery = await updateDeliveryStatus(req.user, deliveryId, status);
  res.json({ data: delivery });
};
