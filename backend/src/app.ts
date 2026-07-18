import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import pinoHttp from 'pino-http';
import { env } from './config/env';
import { logger } from './lib/logger';
import { errorHandler, notFoundHandler } from './middleware/error-handler';
import { apiRouter } from './resources';
import { authRouter } from './auth/auth.routes';
import { ordersWorkflowRouter } from './orders/orders-workflow.routes';
import { deliveriesWorkflowRouter } from './orders/deliveries-workflow.routes';
import { restaurantsWorkflowRouter } from './orders/restaurants-workflow.routes';

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: env.CORS_ORIGIN === '*' ? true : env.CORS_ORIGIN.split(',') }));
  app.use(express.json());
  app.use(pinoHttp({ logger }));

  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 300,
      standardHeaders: true,
      legacyHeaders: false,
    }),
  );

  app.get('/', (_req, res) => {
    res.json({ name: 'BiteDash API', status: 'ok' });
  });

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.use('/api/v1/auth', authRouter);
  // Workflow routes (checkout, status transitions, dashboards) are mounted at the same
  // prefixes as the generic CRUD routers below; non-overlapping path shapes (e.g. /checkout,
  // /:id/status, /:id/orders vs. the generic /, /:id) mean Express falls through cleanly
  // from one to the other with no route conflicts.
  app.use('/api/v1/orders', ordersWorkflowRouter);
  app.use('/api/v1/deliveries', deliveriesWorkflowRouter);
  app.use('/api/v1/restaurants', restaurantsWorkflowRouter);
  app.use('/api/v1', apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
