import { Request, Response } from 'express';
import { refundPayment } from './refund.service';

export const refundController = async (req: Request, res: Response): Promise<void> => {
  const paymentId = Number(req.params.payment_id);
  const payment = await refundPayment(paymentId);
  res.json({ data: payment });
};
