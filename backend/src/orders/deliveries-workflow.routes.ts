import { Router } from 'express';
import { asyncHandler } from '../utils/async-handler';
import { requireAuth } from '../middleware/auth';
import { deliveryStatusController } from './delivery-status.controller';

export const deliveriesWorkflowRouter = Router();

deliveriesWorkflowRouter.patch('/:delivery_id/status', requireAuth, asyncHandler(deliveryStatusController));
