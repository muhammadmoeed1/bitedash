import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import pinoHttp from 'pino-http';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env';
import { logger } from './lib/logger';
import { errorHandler, notFoundHandler } from './middleware/error-handler';
import { asyncHandler } from './utils/async-handler';
import { apiRouter } from './resources';
import { authRouter } from './auth/auth.routes';
import { ordersWorkflowRouter } from './orders/orders-workflow.routes';
import { deliveriesWorkflowRouter } from './orders/deliveries-workflow.routes';
import { restaurantsWorkflowRouter } from './orders/restaurants-workflow.routes';
import { paymentsWorkflowRouter } from './payments/payments-workflow.routes';
import { stripeWebhookController } from './payments/webhook.controller';
import { buildOpenApiDocument } from './docs/openapi';

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: env.CORS_ORIGIN === '*' ? true : env.CORS_ORIGIN.split(',') }));

  // Stripe webhook signature verification needs the exact raw request bytes, so this route
  // must be registered with express.raw() BEFORE the global express.json() below — once
  // express.json() has parsed the body, the original bytes needed for verification are gone.
  app.post(
    '/api/v1/payments/webhook',
    express.raw({ type: 'application/json' }),
    asyncHandler(stripeWebhookController),
  );

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

  const openApiDocument = buildOpenApiDocument();
  app.get('/api-docs.json', (_req, res) => res.json(openApiDocument));
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openApiDocument));

  app.use('/api/v1/auth', authRouter);
  // Workflow routes (checkout, status transitions, dashboards, payments) are mounted at the
  // same prefixes as the generic CRUD routers below; non-overlapping path shapes (e.g.
  // /checkout, /:id/status, /:id/orders, /intent vs. the generic /, /:id) mean Express falls
  // through cleanly from one to the other with no route conflicts.
  app.use('/api/v1/orders', ordersWorkflowRouter);
  app.use('/api/v1/deliveries', deliveriesWorkflowRouter);
  app.use('/api/v1/restaurants', restaurantsWorkflowRouter);
  app.use('/api/v1/payments', paymentsWorkflowRouter);
  app.use('/api/v1', apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
