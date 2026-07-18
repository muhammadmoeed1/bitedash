# BiteDash — Online Food Delivery System

> 🚧 **Under active development.** This project started as a university DBMS coursework
> assignment and is being rebuilt into a full-stack, production-style application.
> See [PROJECT_ROADMAP.md](PROJECT_ROADMAP.md) for the full plan and progress.

## Overview

BiteDash simulates an online food ordering and delivery platform: customers browse
restaurants and menus, place orders, and track delivery; restaurants manage their menu
and orders; delivery agents fulfill deliveries. The original coursework version focused
on a normalized relational database design; this rebuild turns it into a real, deployed
full-stack application.

## Tech Stack

- **Backend:** Node.js, Express, TypeScript
- **Database:** PostgreSQL (hosted on [Neon](https://neon.tech)), accessed via [Prisma](https://prisma.io) with versioned migrations
- **Validation:** Zod
- **Auth:** JWT (access + refresh tokens, rotation + revocation), bcrypt password hashing, role-based access control
- **Frontend:** HTML, CSS, JavaScript *(migrating to React + TypeScript — see roadmap)*

## Project Structure

```
.
├── backend/    # Express + TypeScript REST API (Prisma ORM, layered architecture)
├── frontend/   # Client application (legacy vanilla JS — pending React rebuild)
├── docs/       # Project documentation (including the original coursework report)
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

## Authentication & Authorization

Four roles: `customer`, `restaurant_owner`, `delivery_agent`, `admin`. Auth endpoints live
under `/api/v1/auth`:

| Endpoint | Description |
|---|---|
| `POST /api/v1/auth/register` | Create an account as `customer`, `restaurant_owner`, or `delivery_agent` (admin accounts are not self-registerable) |
| `POST /api/v1/auth/login` | Returns a short-lived access token + a longer-lived refresh token |
| `POST /api/v1/auth/refresh` | Rotates a refresh token for a new access/refresh pair (old one is revoked) |
| `POST /api/v1/auth/logout` | Revokes a refresh token |
| `GET /api/v1/auth/me` | Returns the authenticated user + their linked profile |

Refresh tokens are stored server-side (hashed) so they can be revoked/rotated, rather than
being purely stateless. Reads (`GET`) on all resources are public, matching a typical
food-delivery browsing experience; writes are protected per-resource by role, and — for
resources like menu items, restaurant-category links, restaurant profiles, and deliveries —
by **ownership** (e.g. a `restaurant_owner` can only edit menu items belonging to *their own*
restaurant; a `delivery_agent` can only update the status of deliveries assigned to *them*).
`admin` bypasses ownership checks. This is enforced generically in `backend/src/core/service.ts`
via a small `protect: { create/update/remove: { roles, ownerField } }` config per resource
(see `backend/src/resources/*.ts`), rather than repeated per-route auth logic.

After seeding, demo accounts exist for every role (see `npm run seed` output for the full
list) — all use the password `Password123!`.

## Ordering Workflow

Real order placement and lifecycle management live outside the generic CRUD engine, since
they involve business rules a per-resource config can't express cleanly:

| Endpoint | Who | Description |
|---|---|---|
| `POST /api/v1/orders/checkout` | customer | Places an order from a cart (`{ items: [{ item_id, quantity }] }`). Prices, availability, and single-restaurant-per-order are all re-validated server-side — client-sent prices/totals are never trusted. |
| `PATCH /api/v1/orders/:order_id/status` | customer, restaurant_owner, admin | Transitions an order through its lifecycle (`placed → accepted → preparing → out_for_delivery → delivered`, or `→ cancelled`). Each role may only request specific target statuses on orders they own; illegal transitions (e.g. skipping straight to `delivered`) are rejected. |
| `PATCH /api/v1/deliveries/:delivery_id/status` | delivery_agent, admin | Transitions a delivery (`assigned → picked_up → in_transit → delivered`, or `→ failed`) through its own state machine. Reaching `delivered` automatically syncs the parent order's status too. |
| `GET /api/v1/restaurants/:restaurant_id/orders` | restaurant_owner (own restaurant), admin | Dashboard view of every order containing that restaurant's items, with customer/items/payment/delivery details joined in. |

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

### Frontend

Open `frontend/index.html` in a browser, or serve the `frontend/` directory with any
static file server. **Note:** the legacy frontend targets the old flat API shape
(`/customers`, `/add-customer`, etc.) and is not yet wired up to the new `/api/v1/*`
REST endpoints — this will be resolved when the frontend is rebuilt in React (see roadmap).

## Documentation

- [Project Roadmap](PROJECT_ROADMAP.md) — phased plan for turning this into a portfolio-grade project
- [Original Coursework Report](docs/Online_Food_Delivery_Project_Report.pdf) — the initial academic project report and database design

## License

MIT — see [LICENSE](LICENSE).
