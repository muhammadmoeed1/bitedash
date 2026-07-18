import { Router } from 'express';
import { addressesRouter } from './addresses';
import { customersRouter } from './customers';
import { deliveriesRouter } from './deliveries';
import { deliveryAgentsRouter } from './delivery-agents';
import { foodCategoriesRouter } from './food-categories';
import { menuItemsRouter } from './menu-items';
import { orderItemsRouter } from './order-items';
import { ordersRouter } from './orders';
import { paymentsRouter } from './payments';
import { restaurantCategoriesRouter } from './restaurant-categories';
import { restaurantsRouter } from './restaurants';
import { reviewsRouter } from './reviews';

export const apiRouter = Router();

apiRouter.use('/customers', customersRouter);
apiRouter.use('/addresses', addressesRouter);
apiRouter.use('/restaurants', restaurantsRouter);
apiRouter.use('/food-categories', foodCategoriesRouter);
apiRouter.use('/restaurant-categories', restaurantCategoriesRouter);
apiRouter.use('/menu-items', menuItemsRouter);
apiRouter.use('/orders', ordersRouter);
apiRouter.use('/order-items', orderItemsRouter);
apiRouter.use('/payments', paymentsRouter);
apiRouter.use('/delivery-agents', deliveryAgentsRouter);
apiRouter.use('/deliveries', deliveriesRouter);
apiRouter.use('/reviews', reviewsRouter);
