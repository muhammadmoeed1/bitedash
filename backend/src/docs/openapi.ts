import { z } from 'zod';
import type { PrimaryKey, ResourceConfig } from '../core/types';
import { config as addressesConfig } from '../resources/addresses';
import { config as customersConfig } from '../resources/customers';
import { config as deliveriesConfig } from '../resources/deliveries';
import { config as deliveryAgentsConfig } from '../resources/delivery-agents';
import { config as foodCategoriesConfig } from '../resources/food-categories';
import { config as menuItemsConfig } from '../resources/menu-items';
import { config as orderItemsConfig } from '../resources/order-items';
import { config as ordersConfig } from '../resources/orders';
import { config as paymentsConfig } from '../resources/payments';
import { config as restaurantCategoriesConfig } from '../resources/restaurant-categories';
import { config as restaurantsConfig } from '../resources/restaurants';
import { config as reviewsConfig } from '../resources/reviews';
import { registerSchema, loginSchema, refreshSchema } from '../auth/auth.schemas';
import { checkoutSchema } from '../orders/checkout.schema';
import { orderStatusBodySchema } from '../orders/order-status.schema';
import { deliveryStatusBodySchema } from '../orders/delivery-status.schema';
import { createPaymentIntentSchema } from '../payments/payment-intent.schema';

// The generic CRUD resources (backend/src/resources/*.ts) already carry everything needed
// to describe their own REST surface (path, primary key, Zod schemas, role protection) —
// this reuses that same config metadata instead of hand-writing 12 near-identical path sets.
const RESOURCES: ResourceConfig<unknown, unknown, unknown>[] = [
  customersConfig,
  addressesConfig,
  restaurantsConfig,
  foodCategoriesConfig,
  restaurantCategoriesConfig,
  menuItemsConfig,
  ordersConfig,
  orderItemsConfig,
  paymentsConfig,
  deliveryAgentsConfig,
  deliveriesConfig,
  reviewsConfig,
];

function jsonSchema(schema: z.ZodType) {
  return z.toJSONSchema(schema, { target: 'openapi-3.0', unrepresentable: 'any' });
}

function primaryKeyNames(primaryKey: PrimaryKey): readonly string[] {
  return typeof primaryKey === 'string' ? [primaryKey] : primaryKey;
}

const listResponse = {
  200: {
    description: 'Paginated list',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            data: { type: 'array', items: {} },
            meta: {
              type: 'object',
              properties: {
                total: { type: 'integer' },
                page: { type: 'integer' },
                pageSize: { type: 'integer' },
                totalPages: { type: 'integer' },
              },
            },
          },
        },
      },
    },
  },
};

const itemResponse = (description: string) => ({
  200: {
    description,
    content: { 'application/json': { schema: { type: 'object', properties: { data: {} } } } },
  },
});

const errorResponses = {
  401: { description: 'Missing or invalid access token' },
  403: { description: 'Not allowed to perform this action' },
};

function resourcePaths(config: ResourceConfig<unknown, unknown, unknown>): Record<string, object> {
  const keys = primaryKeyNames(config.primaryKey);
  const idSegment = keys.map((key) => `{${key}}`).join('/');
  const listPath = `/${config.path}`;
  const itemPath = `/${config.path}/${idSegment}`;
  const tag = config.name;

  const idParams = keys.map((key) => ({
    name: key,
    in: 'path',
    required: true,
    schema: { type: 'integer' },
  }));

  const queryParams = [
    { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
    { name: 'pageSize', in: 'query', schema: { type: 'integer', default: 20, maximum: 100 } },
    { name: 'sort', in: 'query', schema: { type: 'string' }, description: 'e.g. field:asc or field:desc' },
    ...(config.searchableFields?.length
      ? [{ name: 'search', in: 'query', schema: { type: 'string' } }]
      : []),
    ...(config.filterableFields ?? []).map((field) => ({
      name: field,
      in: 'query',
      schema: { type: 'string' },
    })),
  ];

  return {
    [listPath]: {
      get: {
        tags: [tag],
        summary: `List ${tag}s`,
        parameters: queryParams,
        responses: listResponse,
      },
      ...(config.protect?.create && {
        post: {
          tags: [tag],
          summary: `Create a ${tag}`,
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: jsonSchema(config.createSchema) } },
          },
          responses: { 201: itemResponse('Created')[200], ...errorResponses },
        },
      }),
    },
    [itemPath]: {
      get: {
        tags: [tag],
        summary: `Get a single ${tag}`,
        parameters: idParams,
        responses: { ...itemResponse('Found'), 404: { description: 'Not found' } },
      },
      ...(config.protect?.update && {
        patch: {
          tags: [tag],
          summary: `Update a ${tag}`,
          security: [{ bearerAuth: [] }],
          parameters: idParams,
          requestBody: { content: { 'application/json': { schema: jsonSchema(config.updateSchema) } } },
          responses: { ...itemResponse('Updated'), ...errorResponses, 404: { description: 'Not found' } },
        },
      }),
      ...(config.protect?.remove && {
        delete: {
          tags: [tag],
          summary: `Delete a ${tag}`,
          security: [{ bearerAuth: [] }],
          parameters: idParams,
          responses: { 204: { description: 'Deleted' }, ...errorResponses, 404: { description: 'Not found' } },
        },
      }),
    },
  };
}

// Hand-written business-workflow endpoints (checkout, lifecycle transitions, payments, auth)
// live outside the generic CRUD engine, so their paths are authored directly here too.
const workflowPaths: Record<string, object> = {
  '/auth/register': {
    post: {
      tags: ['auth'],
      summary: 'Register a new customer, restaurant owner, or delivery agent',
      requestBody: {
        required: true,
        content: { 'application/json': { schema: jsonSchema(registerSchema) } },
      },
      responses: { 201: { description: 'Account created, returns access + refresh tokens' } },
    },
  },
  '/auth/login': {
    post: {
      tags: ['auth'],
      summary: 'Log in with email + password',
      requestBody: {
        required: true,
        content: { 'application/json': { schema: jsonSchema(loginSchema) } },
      },
      responses: { 200: { description: 'Returns the user + access + refresh tokens' }, 401: { description: 'Invalid credentials' } },
    },
  },
  '/auth/refresh': {
    post: {
      tags: ['auth'],
      summary: 'Rotate a refresh token for a new access/refresh pair',
      requestBody: {
        required: true,
        content: { 'application/json': { schema: jsonSchema(refreshSchema) } },
      },
      responses: { 200: { description: 'New access + refresh tokens' }, 401: { description: 'Invalid or revoked refresh token' } },
    },
  },
  '/auth/logout': {
    post: {
      tags: ['auth'],
      summary: 'Revoke a refresh token',
      requestBody: {
        required: true,
        content: { 'application/json': { schema: jsonSchema(refreshSchema) } },
      },
      responses: { 204: { description: 'Revoked' } },
    },
  },
  '/auth/me': {
    get: {
      tags: ['auth'],
      summary: 'Get the authenticated user and their linked profile',
      security: [{ bearerAuth: [] }],
      responses: { 200: { description: 'Current user' }, 401: { description: 'Missing or invalid access token' } },
    },
  },
  '/orders/checkout': {
    post: {
      tags: ['ordering workflow'],
      summary: 'Place an order from a cart (customer only)',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: { 'application/json': { schema: jsonSchema(checkoutSchema) } },
      },
      responses: {
        201: { description: 'Order placed — prices/availability re-validated server-side' },
        422: { description: 'Empty cart, unavailable item, or items from more than one restaurant' },
        ...errorResponses,
      },
    },
  },
  '/orders/{order_id}/status': {
    patch: {
      tags: ['ordering workflow'],
      summary: "Transition an order's status (state-machine enforced)",
      security: [{ bearerAuth: [] }],
      parameters: [{ name: 'order_id', in: 'path', required: true, schema: { type: 'integer' } }],
      requestBody: {
        required: true,
        content: { 'application/json': { schema: jsonSchema(orderStatusBodySchema) } },
      },
      responses: { 200: { description: 'Order updated' }, 422: { description: 'Illegal status transition' }, ...errorResponses },
    },
  },
  '/deliveries/{delivery_id}/status': {
    patch: {
      tags: ['ordering workflow'],
      summary: "Transition a delivery's status (state-machine enforced; delivered syncs the parent order)",
      security: [{ bearerAuth: [] }],
      parameters: [{ name: 'delivery_id', in: 'path', required: true, schema: { type: 'integer' } }],
      requestBody: {
        required: true,
        content: { 'application/json': { schema: jsonSchema(deliveryStatusBodySchema) } },
      },
      responses: { 200: { description: 'Delivery updated' }, 422: { description: 'Illegal status transition' }, ...errorResponses },
    },
  },
  '/restaurants/{restaurant_id}/orders': {
    get: {
      tags: ['ordering workflow'],
      summary: "Restaurant-owner dashboard: every order containing that restaurant's items",
      security: [{ bearerAuth: [] }],
      parameters: [{ name: 'restaurant_id', in: 'path', required: true, schema: { type: 'integer' } }],
      responses: { 200: { description: 'Orders with items/customer/payment/delivery joined in' }, ...errorResponses },
    },
  },
  '/payments/intent': {
    post: {
      tags: ['payments'],
      summary: "Create a Stripe PaymentIntent for an order's total",
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: { 'application/json': { schema: jsonSchema(createPaymentIntentSchema) } },
      },
      responses: {
        200: { description: 'Returns a clientSecret to confirm the card payment with' },
        503: { description: 'Stripe is not configured on this server' },
        ...errorResponses,
      },
    },
  },
  '/payments/{payment_id}/refund': {
    post: {
      tags: ['payments'],
      summary: 'Refund a completed payment (admin only)',
      security: [{ bearerAuth: [] }],
      parameters: [{ name: 'payment_id', in: 'path', required: true, schema: { type: 'integer' } }],
      responses: { 200: { description: 'Refund issued' }, 503: { description: 'Stripe is not configured' }, ...errorResponses },
    },
  },
  '/payments/webhook': {
    post: {
      tags: ['payments'],
      summary: 'Stripe webhook receiver (payment_intent.succeeded / payment_intent.payment_failed)',
      description: 'Called by Stripe, not by API clients. Signature-verified against the raw request body.',
      responses: { 200: { description: 'Event processed' }, 400: { description: 'Invalid signature' } },
    },
  },
};

export function buildOpenApiDocument() {
  const paths = RESOURCES.reduce<Record<string, object>>(
    (acc, config) => ({ ...acc, ...resourcePaths(config) }),
    { ...workflowPaths },
  );

  return {
    openapi: '3.0.3',
    info: {
      title: 'BiteDash API',
      version: '2.0.0',
      description:
        'REST API for BiteDash, a full-stack food ordering & delivery platform. ' +
        '12 resources share a generic CRUD engine (list/get/create/update/delete with ' +
        'pagination, sorting, filtering, and search); ordering, payments, and auth are ' +
        'hand-written workflow endpoints layered on top. All demo accounts use the ' +
        'password `Password123!` after running `npm run seed`.',
    },
    servers: [{ url: '/api/v1' }],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
    },
    tags: [
      { name: 'auth' },
      { name: 'ordering workflow' },
      { name: 'payments' },
      ...RESOURCES.map((config) => ({ name: config.name })),
    ],
    paths,
  };
}
