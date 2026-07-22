# BiteDash — Online Food Delivery System

[![CI](https://github.com/muhammadmoeed1/bitedash/actions/workflows/ci.yml/badge.svg)](https://github.com/muhammadmoeed1/bitedash/actions/workflows/ci.yml)

> 🚧 **Under active development.** This project started as a university DBMS coursework
> assignment and is being rebuilt into a full-stack, production-style application.
> See [PROJECT_ROADMAP.md](PROJECT_ROADMAP.md) for the full plan and progress.

## Overview

BiteDash simulates an online food ordering and delivery platform: customers browse
restaurants and menus, place orders, and track delivery; restaurants manage their menu
and orders; delivery agents fulfill deliveries. The original coursework version focused
on a normalized relational database design; this rebuild turns it into a real, deployed
full-stack application.

## Screenshots

<table>
<tr>
<td width="50%"><img src="docs/screenshots/03-restaurants.png" alt="Restaurant listing"></td>
<td width="50%"><img src="docs/screenshots/04-menu.png" alt="Restaurant menu"></td>
</tr>
<tr>
<td align="center"><sub>Browse restaurants (public, no login required)</sub></td>
<td align="center"><sub>Menu with live availability</sub></td>
</tr>
<tr>
<td width="50%"><img src="docs/screenshots/06-checkout.png" alt="Checkout"></td>
<td width="50%"><img src="docs/screenshots/07-order-tracking.png" alt="Live order tracking"></td>
</tr>
<tr>
<td align="center"><sub>Checkout — server-validated cart</sub></td>
<td align="center"><sub>Live order tracking (Socket.IO)</sub></td>
</tr>
<tr>
<td width="50%"><img src="docs/screenshots/08-restaurant-dashboard.png" alt="Restaurant owner dashboard"></td>
<td width="50%"><img src="docs/screenshots/09-delivery-dashboard.png" alt="Delivery agent dashboard"></td>
</tr>
<tr>
<td align="center"><sub>Restaurant-owner dashboard</sub></td>
<td align="center"><sub>Delivery-agent dashboard</sub></td>
</tr>
<tr>
<td colspan="2"><img src="docs/screenshots/10-admin-dashboard.png" alt="Admin analytics dashboard"></td>
</tr>
<tr>
<td align="center" colspan="2"><sub>Admin analytics dashboard (Recharts, computed live from the database)</sub></td>
</tr>
</table>

## Tech Stack

- **Backend:** Node.js, Express, TypeScript
- **Database:** PostgreSQL (hosted on [Neon](https://neon.tech)), accessed via [Prisma](https://prisma.io) with versioned migrations
- **Validation:** Zod
- **Auth:** JWT (access + refresh tokens, rotation + revocation), bcrypt password hashing, role-based access control
- **Payments:** Stripe (test mode) — PaymentIntents + webhook-driven confirmation + refunds
- **Real-time:** Socket.IO — live order/delivery status + delivery location tracking
- **Frontend:** React + TypeScript (Vite), Tailwind CSS, React Router, TanStack Query, Zustand, Recharts
- **Quality:** Vitest (backend + frontend), React Testing Library, Playwright (E2E), ESLint + Prettier, Husky + lint-staged
- **API Docs:** OpenAPI 3.0 + Swagger UI, generated from the same Zod schemas that validate requests

## Project Structure

```
.
├── backend/    # Express + TypeScript REST API (Prisma ORM, layered architecture)
├── frontend/   # React + TypeScript SPA (Vite, Tailwind, TanStack Query, Zustand)
├── docs/       # Project documentation + archived original coursework frontend & report
└── PROJECT_ROADMAP.md
```

## Backend Architecture

The API follows a layered, generic CRUD architecture shared across all 12 resources
(customers, restaurants, menu items, orders, payments, deliveries, reviews, etc.):

```
routes (Express Router)
  -> controller (parses request, validates with Zod, shapes response)
    -> service (business logic, pagination/filtering, error mapping)
      -> repository (Prisma Client data access)
```

Each resource (`backend/src/resources/*.ts`) declares its own Zod validation schemas and
a small config object (primary key, filterable/sortable fields); the shared engine in
`backend/src/core/` handles the rest. This avoids ~12x duplicated CRUD boilerplate while
keeping each resource's validation and business rules explicit and typed.

All list endpoints support pagination (`?page=&pageSize=`), sorting (`?sort=field:asc|desc`),
and filtering by allow-listed fields (e.g. `?customer_id=3`). Errors are normalized into a
consistent `{ error: { message, details } }` JSON shape via centralized middleware.

**Interactive API docs** are served straight off the same resource configs — run the backend
and open `http://localhost:6006/api-docs` for a Swagger UI covering all 36 endpoints (the raw
OpenAPI document is at `/api-docs.json`). `backend/src/docs/openapi.ts` builds it from each
resource's Zod schemas (via `z.toJSONSchema`) plus its `protect`/`filterableFields` config,
so the docs can't drift out of sync with the actual validation and auth rules.

## Authentication & Authorization

Four roles: `customer`, `restaurant_owner`, `delivery_agent`, `admin`. Auth endpoints live
under `/api/v1/auth`:

| Endpoint                     | Description                                                                                                         |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `POST /api/v1/auth/register` | Create an account as `customer`, `restaurant_owner`, or `delivery_agent` (admin accounts are not self-registerable) |
| `POST /api/v1/auth/login`    | Returns a short-lived access token + a longer-lived refresh token                                                   |
| `POST /api/v1/auth/refresh`  | Rotates a refresh token for a new access/refresh pair (old one is revoked)                                          |
| `POST /api/v1/auth/logout`   | Revokes a refresh token                                                                                             |
| `GET /api/v1/auth/me`        | Returns the authenticated user + their linked profile                                                               |

Refresh tokens are stored server-side (hashed) so they can be revoked/rotated, rather than
being purely stateless. Reads (`GET`) on all resources are public, matching a typical
food-delivery browsing experience; writes are protected per-resource by role, and — for
resources like menu items, restaurant-category links, restaurant profiles, and deliveries —
by **ownership** (e.g. a `restaurant_owner` can only edit menu items belonging to _their own_
restaurant; a `delivery_agent` can only update the status of deliveries assigned to _them_).
`admin` bypasses ownership checks. This is enforced generically in `backend/src/core/service.ts`
via a small `protect: { create/update/remove: { roles, ownerField } }` config per resource
(see `backend/src/resources/*.ts`), rather than repeated per-route auth logic.

After seeding, demo accounts exist for every role (see `npm run seed` output for the full
list) — all use the password `Password123!`.

## Ordering Workflow

Real order placement and lifecycle management live outside the generic CRUD engine, since
they involve business rules a per-resource config can't express cleanly:

| Endpoint                                        | Who                                      | Description                                                                                                                                                                                                                                                                      |
| ----------------------------------------------- | ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `POST /api/v1/orders/checkout`                  | customer                                 | Places an order from a cart (`{ items: [{ item_id, quantity }] }`). Prices, availability, and single-restaurant-per-order are all re-validated server-side — client-sent prices/totals are never trusted.                                                                        |
| `PATCH /api/v1/orders/:order_id/status`         | customer, restaurant_owner, admin        | Transitions an order through its lifecycle (`placed → accepted → preparing → out_for_delivery → delivered`, or `→ cancelled`). Each role may only request specific target statuses on orders they own; illegal transitions (e.g. skipping straight to `delivered`) are rejected. |
| `PATCH /api/v1/deliveries/:delivery_id/status`  | delivery_agent, admin                    | Transitions a delivery (`assigned → picked_up → in_transit → delivered`, or `→ failed`) through its own state machine. Reaching `delivered` automatically syncs the parent order's status too.                                                                                   |
| `GET /api/v1/restaurants/:restaurant_id/orders` | restaurant_owner (own restaurant), admin | Dashboard view of every order containing that restaurant's items, with customer/items/payment/delivery details joined in.                                                                                                                                                        |

The state machines and role/ownership rules live in `backend/src/orders/order-status.ts`
and the small services alongside it — kept as explicit, readable code rather than forced
into the generic engine, since lifecycle transitions are exactly the kind of business logic
that deserves to be visible, not abstracted away.

Reviews are similarly gated by a business rule (not just CRUD validation): a customer can
only review a restaurant they've had a `delivered` order from, enforced via a `beforeCreate`
hook on the reviews resource config (`backend/src/resources/reviews.ts`).

Restaurants and menu items also support free-text search via `?search=` (matched
case-insensitively against name/description fields), in addition to the existing
pagination/sorting/filtering.

## Payments (Stripe, test mode)

Payments use [Stripe](https://stripe.com) in test mode — no real money, no business
account required (grab free test keys from the Stripe dashboard). The flow is
webhook-driven so payment status is only ever confirmed by Stripe, never by the client:

| Endpoint                                   | Who                         | Description                                                                                                                                                                                                                                                                                            |
| ------------------------------------------ | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `POST /api/v1/payments/intent`             | customer (own order), admin | Creates a Stripe PaymentIntent for an order's total (amount derived server-side from the order, never the client). Idempotent — repeated calls for the same unpaid order reuse the existing intent instead of double-charging. Returns a `clientSecret` the frontend uses to confirm the card payment. |
| `POST /api/v1/payments/webhook`            | Stripe                      | Receives `payment_intent.succeeded` / `payment_intent.payment_failed` events and updates the corresponding payment record. Signature-verified against the raw request body.                                                                                                                            |
| `POST /api/v1/payments/:payment_id/refund` | admin                       | Issues a Stripe refund for a completed payment and marks it `refunded`.                                                                                                                                                                                                                                |

**Configuration is optional** — if `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` are not set,
the server still boots normally and payment endpoints return a clear `503 "Payments are not
configured"` rather than crashing. All business rules (ownership, "already paid", "order
cancelled", valid amount) are validated _before_ Stripe is called, so those checks work and
are testable even without live keys. To enable real test-mode payments locally:

```bash
# 1. Put your test keys in backend/.env (see .env.example)
# 2. Forward Stripe webhooks to your local server with the Stripe CLI:
stripe listen --forward-to localhost:6006/api/v1/payments/webhook
```

## Real-Time Tracking (Socket.IO)

A Socket.IO server runs alongside the REST API on the same port, giving customers live order
updates without polling. Clients authenticate at the WebSocket handshake with their JWT access
token, then subscribe to the orders they're allowed to watch:

```js
import { io } from 'socket.io-client';

const socket = io('http://localhost:6006', { auth: { token: accessToken } });

// Subscribe to an order you're a party to (customer / restaurant owner / assigned agent / admin)
socket.emit('subscribe:order', orderId, (res) => console.log(res)); // { ok: true } or { ok: false, error }

socket.on('order:status', (e) => {
  /* { order_id, status } */
});
socket.on('delivery:status', (e) => {
  /* { delivery_id, order_id, status } */
});
socket.on('delivery:location', (e) => {
  /* { delivery_id, order_id, lat, lng, at } */
});
socket.on('payment:status', (e) => {
  /* { order_id, payment_status } */
});

// Delivery agents stream their live GPS for a delivery; the server re-broadcasts it to the
// order's room (only the assigned agent — or an admin — is allowed to push):
socket.emit('delivery:location', { delivery_id, lat, lng });
```

Events are scoped to an `order:<id>` room and pushed automatically whenever an order or
delivery status changes (via the REST endpoints) or a Stripe payment is confirmed. Subscription
authorization reuses the same ownership rules as the REST layer, so a customer can never watch
another customer's order. The real-time layer is decoupled from business logic
(`backend/src/realtime/events.ts`) — services just call typed emit helpers, so nothing breaks
if sockets are disabled.

## Getting Started

### Backend

```bash
cd backend
npm install                # also generates the Prisma client (postinstall)
cp .env.example .env       # fill in your own PostgreSQL connection string
npm run prisma:migrate     # apply database migrations
npm run seed               # (optional) populate sample data — WARNING: wipes existing rows
npm run dev                # start the API in watch mode on http://localhost:6006
```

Other useful scripts: `npm run build` (compile to `dist/`), `npm start` (run the compiled
build), `npm run typecheck`, `npm run prisma:studio` (visual DB browser).

### Backend via Docker (no Neon account needed)

```bash
docker compose up --build     # Postgres + backend, from a clean slate
```

This runs the backend against a local Postgres container instead of Neon — good for trying
the project without setting up any cloud accounts. The container applies migrations
automatically on boot (`prisma migrate deploy`, see `backend/Dockerfile`). To also load the
demo dataset, run the seed script from the host against the container's exposed Postgres port:

```bash
cd backend
DATABASE_URL="postgresql://bitedash:bitedash@localhost:5432/bitedash?sslmode=disable" npm run seed
```

### Frontend

```bash
cd frontend
npm install
npm run dev     # starts Vite on http://localhost:5173
```

In development the frontend proxies `/api` and `/socket.io` to the backend on port 6006
(see `vite.config.ts`), so just run the backend alongside it and open http://localhost:5173.
For production builds, set `VITE_API_URL` (see `frontend/.env.example`) to the deployed API
origin, then `npm run build` (outputs to `frontend/dist`).

The UI covers every role from one app: a customer browse → cart → checkout → **live order
tracking** flow, a restaurant-owner dashboard (accept/advance orders, manage menu), a
delivery-agent view (advance deliveries, stream live GPS), and an admin analytics dashboard
(Recharts, computed live from the API). Log in with any seeded demo account (all use
password `Password123!`) — the login screen has one-tap buttons for each role.

> The original vanilla-JS coursework frontend is archived under
> [`docs/legacy-frontend/`](docs/legacy-frontend/) for reference.

## Frontend Architecture

- **React + TypeScript + Vite** SPA, styled with **Tailwind CSS v4**
- **React Router** with role-aware protected routes (`src/components/ProtectedRoute.tsx`)
- **TanStack Query** for all server state (caching, refetch, invalidation); **Zustand** for
  auth session and a persisted cart
- **axios** client with an interceptor that attaches the JWT and transparently refreshes it
  on a 401, then replays the request (`src/lib/api.ts`)
- **socket.io-client** for live order tracking (`src/hooks/useOrderRealtime.ts`)
- Route-level **code splitting** keeps the charting library out of the main bundle

## Testing & Code Quality

```bash
cd backend  && npm test    # 49 tests — unit + HTTP integration, no live DB needed
cd frontend && npm test    # 17 tests — component + store tests (Vitest + RTL)
```

Neither test suite touches the real Neon database — the pooled connection is too slow and
unreliable for fast test iteration, and tests shouldn't depend on network access or wipe live
data anyway. Instead:

- **Backend unit tests** cover the order/delivery state machines, password hashing, JWT
  sign/verify, and the generic CRUD engine (pagination, filtering, search, sorting, ownership
  enforcement, business-rule hooks) — the last one via a hand-written in-memory fake Prisma
  delegate, so the whole engine is exercised with zero DB dependency.
- **Backend integration tests** mock the Prisma client module entirely and drive real HTTP
  requests through the actual Express app (Supertest): a full auth journey — register,
  duplicate-rejected, wrong-password-rejected, login, `/me`, refresh rotation, old-token-reuse
  rejected, logout, post-logout-refresh-rejected.
- **Frontend tests** cover the cart store's business rules (single-restaurant-per-order,
  quantity/total math), shared UI primitives, and `ProtectedRoute`'s role/auth redirect logic.

Both packages run **ESLint (flat config) + Prettier**, and a root-level **Husky + lint-staged**
pre-commit hook lints and formats only the staged files in whichever package they belong to
before every commit.

**End-to-end tests** (`frontend/e2e/happy-path.spec.ts`, Playwright) drive a real browser
through the full customer journey — login, browse, add to cart, checkout, place an order, and
verify the live tracking page — against the real backend and database:

```bash
cd backend  && npm run seed   # demo accounts must exist
cd frontend && npm run test:e2e
```

Unlike the Vitest suites, this one _does_ need a live, seeded database, so it's deliberately
**not** part of CI — consistent with CI having zero live-DB dependency (see above). It's a
local/pre-deploy sanity check, run against `npm run dev` on both packages.

## CI/CD & Deployment

**Continuous integration** ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)) runs on every
push/PR to `master`: lint, typecheck, test, and build — for both packages, independently. No
live database or secrets are required (see [Testing & Code Quality](#testing--code-quality)
above for why), so CI needs zero configuration beyond the workflow file itself.

**Deployment** targets a split setup — backend on [Render](https://render.com) (Docker), frontend
on [Vercel](https://vercel.com), database on [Neon](https://neon.tech) (already in use):

1. **Backend → Render.** [`render.yaml`](render.yaml) is a Render Blueprint. On render.com:
   "New +" → "Blueprint" → connect this repo. Render builds `backend/Dockerfile` and prompts you
   for the secrets marked `sync: false` (your Neon `DATABASE_URL`, JWT secrets, Stripe keys,
   `CORS_ORIGIN` set to your deployed frontend's URL). The container runs `prisma migrate deploy`
   on every boot before starting the server, so schema changes roll out automatically.
2. **Frontend → Vercel.** Import the repo on vercel.com, set the project's root directory to
   `frontend`, and set `VITE_API_URL` to your deployed backend's URL. [`vercel.json`](frontend/vercel.json)
   adds the SPA rewrite so client-side routes (e.g. `/orders/5`) don't 404 on direct load.
3. **Stripe webhook** (if payments are enabled): point Stripe's webhook endpoint at
   `<backend-url>/api/v1/payments/webhook` and set `STRIPE_WEBHOOK_SECRET` to the signing secret
   Stripe gives you for that endpoint.

Both platforms auto-redeploy on every push to `master` once connected — no custom CD workflow
needed, that's handled by their GitHub integration directly.

## What I Built & Learned

This started as a university DBMS coursework project — a 12-table PostgreSQL schema behind a
single vanilla-JS page. Rebuilding it into BiteDash meant turning "a database with a UI" into
an actual application with the concerns real systems have to deal with:

- **A generic engine, not 12 copy-pasted CRUD controllers.** Once I'd written the third nearly
  identical resource (routes → controller → service → repository), it was clear the _shape_
  was reusable and only the _config_ (schema, primary key, filterable fields, ownership rule)
  differed. The trade-off I kept coming back to: push genuinely generic plumbing (pagination,
  filtering, ownership checks) into the shared engine, but keep business logic that has real
  rules — order/delivery state machines, checkout validation, review eligibility — as explicit,
  hand-written code. Forcing a state machine into a generic config would have made it _shorter_
  but harder to read, which is the wrong trade for logic that matters.
- **Client-sent data is a suggestion, not a fact.** Prices, totals, and order status transitions
  are all re-derived or re-validated server-side, never trusted from the request body — the
  kind of thing that's easy to skip in a coursework project and isn't optional in a real one.
- **Tests need a strategy, not just a runner.** Neon's pooled serverless Postgres connection is
  too slow and unreliable for fast local iteration (confirmed the hard way — see the CI section
  below), so the whole test suite (unit + integration) runs against in-memory fakes and a fully
  mocked Prisma client instead of a live database. That was a deliberate constraint that paid
  off twice: tests run fast locally, and CI needs zero secrets or database access at all.
- **Debugging across an async boundary means questioning your own tooling first.** While
  capturing the screenshots in this README, one came out showing the login page where the
  checkout page should have been. The instinctive assumption — "the app has an auth bug" — was
  wrong twice over: it was really Neon's serverless cold-start latency racing against a
  Playwright script that didn't wait for real navigation before asserting success. The fix
  wasn't in the app at all; it was replacing fixed timeouts with waits for the actual state
  change. It's the same lesson as the test-database decision above, from the other direction.
- **Docs that can't drift.** The OpenAPI documentation is generated from the same Zod schemas
  and resource configs that validate real requests, rather than hand-written and maintained
  separately — so the documented API and the enforced API are structurally the same thing.

## Documentation

- [Project Roadmap](PROJECT_ROADMAP.md) — phased plan for turning this into a portfolio-grade project
- [Architecture Overview](docs/ARCHITECTURE.md) — system diagram, request-flow sequence diagram, layering, and why each major tech choice was made
- [ER Diagram](docs/ER_DIAGRAM.md) — the full 14-table schema (12 business tables + 2 auth tables) and the reasoning behind a few of its design decisions
- [Original Coursework Report](docs/Online_Food_Delivery_Project_Report.pdf) — the initial academic project report and database design

## License

MIT — see [LICENSE](LICENSE).
