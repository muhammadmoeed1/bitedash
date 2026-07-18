import { Router } from 'express';
import { asyncHandler } from '../utils/async-handler';
import { requireAuth } from '../middleware/auth';
import { listRestaurantOrders } from './restaurant-orders.controller';

export const restaurantsWorkflowRouter = Router();

restaurantsWorkflowRouter.get('/:restaurant_id/orders', requireAuth, asyncHandler(listRestaurantOrders));
