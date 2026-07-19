import { beforeAll, describe, expect, it, vi } from 'vitest';
import request from 'supertest';

// In-memory stand-in for the whole Prisma client, scoped to this test file. Lets us exercise
// real HTTP requests through the real Express app/middleware without a live database.
vi.mock('../lib/prisma', () => {
  interface Row {
    [key: string]: unknown;
  }

  const users: Row[] = [];
  const customers: Row[] = [];
  const restaurants: Row[] = [];
  const deliveryAgents: Row[] = [];
  const refreshTokens: Row[] = [];
  let nextUserId = 1;
  let nextTokenId = 1;

  const prisma = {
    users: {
      findUnique: async ({ where, select }: { where: Row; select?: Row }) => {
        const user = users.find((u) =>
          where.email !== undefined ? u.email === where.email : u.user_id === where.user_id,
        );
        if (!user) return null;
        if (!select) return user;
        const result: Row = {};
        for (const key of Object.keys(select)) {
          if (key === 'customer') result.customer = customers.find((c) => c.user_id === user.user_id) ?? null;
          else if (key === 'restaurant')
            result.restaurant = restaurants.find((r) => r.owner_user_id === user.user_id) ?? null;
          else if (key === 'delivery_agent')
            result.delivery_agent = deliveryAgents.find((d) => d.user_id === user.user_id) ?? null;
          else result[key] = user[key];
        }
        return result;
      },
      create: async ({ data }: { data: Row }) => {
        const user = { user_id: nextUserId++, created_at: new Date(0), ...data };
        users.push(user);
        return user;
      },
      delete: async ({ where }: { where: Row }) => {
        const idx = users.findIndex((u) => u.user_id === where.user_id);
        if (idx === -1) throw new Error('fake prisma: user not found for delete');
        return users.splice(idx, 1)[0];
      },
    },
    customers: {
      create: async ({ data }: { data: Row }) => {
        const row = { customer_id: customers.length + 1, ...data };
        customers.push(row);
        return row;
      },
    },
    restaurants: {
      create: async ({ data }: { data: Row }) => {
        const row = { restaurant_id: restaurants.length + 1, ...data };
        restaurants.push(row);
        return row;
      },
    },
    delivery_agents: {
      create: async ({ data }: { data: Row }) => {
        const row = { agent_id: deliveryAgents.length + 1, ...data };
        deliveryAgents.push(row);
        return row;
      },
    },
    refresh_tokens: {
      create: async ({ data }: { data: Row }) => {
        const row = { token_id: nextTokenId++, revoked_at: null, ...data };
        refreshTokens.push(row);
        return row;
      },
      findFirst: async ({ where }: { where: Row }) =>
        refreshTokens.find(
          (t) => t.user_id === where.user_id && t.token_hash === where.token_hash && t.revoked_at === null,
        ) ?? null,
      update: async ({ where, data }: { where: Row; data: Row }) => {
        const idx = refreshTokens.findIndex((t) => t.token_id === where.token_id);
        refreshTokens[idx] = { ...refreshTokens[idx], ...data };
        return refreshTokens[idx];
      },
      updateMany: async ({ where, data }: { where: Row; data: Row }) => {
        let count = 0;
        for (const t of refreshTokens) {
          if (t.token_hash === where.token_hash && t.revoked_at === null) {
            Object.assign(t, data);
            count++;
          }
        }
        return { count };
      },
    },
  };

  return { prisma };
});

let app: import('express').Express;

beforeAll(async () => {
  // Importing the full app pulls in every resource router, the realtime module, etc. — a much
  // heavier transform/import chain than the other test files, so give it more room than the
  // 10s default before calling it a hang.
  const { createApp } = await import('../app.js');
  app = createApp();
}, 30000);

// A single ordered journey rather than isolated per-test resets — realistic for an auth flow
// where each step depends on the previous one's tokens (register -> login -> refresh -> logout).
describe('auth HTTP flow', () => {
  const email = 'journey.customer@example.com';
  const password = 'Password123!';
  let accessToken: string;
  let refreshToken: string;

  it('registers a new customer and returns tokens', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ role: 'customer', email, password, name: 'Journey Customer' });

    expect(res.status).toBe(201);
    expect(res.body.user).toMatchObject({ email, role: 'customer' });
    expect(res.body.accessToken).toBeTruthy();
    expect(res.body.refreshToken).toBeTruthy();
    accessToken = res.body.accessToken;
    refreshToken = res.body.refreshToken;
  });

  it('rejects a duplicate registration with the same email', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ role: 'customer', email, password, name: 'Duplicate' });
    expect(res.status).toBe(409);
  });

  it('rejects login with the wrong password', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({ email, password: 'wrong-password' });
    expect(res.status).toBe(401);
  });

  it('logs in with the correct password', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({ email, password });
    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeTruthy();
  });

  it('rejects /me without a token', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    expect(res.status).toBe(401);
  });

  it('returns the current user for /me with a valid token', async () => {
    const res = await request(app).get('/api/v1/auth/me').set('Authorization', `Bearer ${accessToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ email, role: 'customer' });
    expect(res.body.data.customer).toMatchObject({ name: 'Journey Customer' });
  });

  it('rotates the refresh token', async () => {
    const res = await request(app).post('/api/v1/auth/refresh').send({ refreshToken });
    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeTruthy();
    expect(res.body.refreshToken).not.toBe(refreshToken);
    refreshToken = res.body.refreshToken;
  });

  it('rejects reuse of the now-rotated (old) refresh token', async () => {
    const res = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: 'this-is-not-the-current-token-anymore' });
    expect(res.status).toBe(401);
  });

  it('logs out (revokes the current refresh token)', async () => {
    const res = await request(app).post('/api/v1/auth/logout').send({ refreshToken });
    expect(res.status).toBe(204);
  });

  it('rejects refreshing with a revoked token', async () => {
    const res = await request(app).post('/api/v1/auth/refresh').send({ refreshToken });
    expect(res.status).toBe(401);
  });
});

describe('auth validation', () => {
  it('rejects registration with a short password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ role: 'customer', email: 'weak@example.com', password: 'short', name: 'Weak' });
    expect(res.status).toBe(400);
  });

  it('rejects self-registration as admin', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ role: 'admin', email: 'fake-admin@example.com', password: 'Password123!' });
    expect(res.status).toBe(400);
  });
});
