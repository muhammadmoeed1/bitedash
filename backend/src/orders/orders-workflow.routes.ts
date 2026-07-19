import { Router } from 'express';
import { asyncHandler } from '../utils/async-handler';
import { requireAuth, requireRole } from '../middleware/auth';
import { checkoutController } from './checkout.controller';
import { orderStatusController } from './order-status.controller';

export const ordersWorkflowRouter = Router();

ordersWorkflowRouter.post(
  '/checkout',
  requireAuth,
  requireRole('customer'),
  asyncHandler(checkoutController),
);
ordersWorkflowRouter.patch('/:order_id/status', requireAuth, asyncHandler(orderStatusController));
