import { Router } from 'express';
import { asyncHandler } from '../utils/async-handler';
import { requireAuth, requireRole } from '../middleware/auth';
import { createPaymentIntentController } from './payment-intent.controller';
import { refundController } from './refund.controller';

export const paymentsWorkflowRouter = Router();

paymentsWorkflowRouter.post('/intent', requireAuth, asyncHandler(createPaymentIntentController));
paymentsWorkflowRouter.post('/:payment_id/refund', requireAuth, requireRole('admin'), asyncHandler(refundController));
