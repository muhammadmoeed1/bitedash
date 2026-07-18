# BiteDash — Portfolio Flagship Roadmap

Transform **BiteDash** from a university DBMS coursework demo into a genuinely functional,
deployed, well-engineered full-stack application that stands out on GitHub and anchors a CV.

- **Target audience:** General SWE / new-grad hiring
- **Stack direction:** Modernize — React + TypeScript (frontend), TypeScript + layered architecture (backend)
- **Ambition:** Portfolio flagship — auth, payments (test mode), real-time tracking, tests, CI/CD, live demo

> **How to use this file:** Work top to bottom. Each phase is independently shippable and leaves the
> project in a better state than before. Check items off as you go. Don't skip Phase 0 — it protects you.

---

## Current State (baseline)

| Area | Today | Target |
|---|---|---|
| Backend | Layered TypeScript API (routes → controllers → services → repositories), generic CRUD engine over 12 resources | ✅ Done — next: harden per business rules as real features land |
| Auth | None | JWT auth + role-based access (customer / restaurant / rider / admin) |
| Frontend | 1 static HTML page, vanilla JS, hardcoded `localhost:6006` | React + TypeScript SPA, real ordering flow |
| Database | 12-table PostgreSQL (Neon), schema versioned via Prisma migrations + seed script | ✅ Done |
| Payments | "Payments" table, no processing | Stripe test-mode checkout + webhooks |
| Real-time | None | WebSocket order/delivery tracking |
| Tests | None | Backend + frontend tests, CI-gated |
| DevOps | None | Docker, GitHub Actions CI/CD, live deploy |
| Docs | 25-page PDF, no README | Rich README, API docs, ER diagram, live demo link |
| Version control | No git repo | Clean, meaningful commit history |

---

## Phase 0 — Foundation & Safety Net ⚠️ (do this first)

**Goal:** Get the project under version control, remove the security landmine, and set up a clean structure.

- [x] Initialize a git repository and make an initial commit of the current state
- [x] Add a proper `.gitignore` (node_modules, `.env`, build output, etc.)
- [x] **Remove the committed `.env` / DB credentials from the repo and rotate the Neon password** (rotated on Neon dashboard, connection verified with new password)
- [x] Add `.env.example` files documenting required variables (no real values)
- [x] Restructure into a clear layout (e.g. `backend/`, `frontend/`, `docs/`)
- [x] Add `LICENSE` (MIT is a safe default) and a minimal `README.md` placeholder
- [x] Create the GitHub repository and push — live at https://github.com/muhammadmoeed1/bitedash

**Deliverable:** A safe, versioned, well-organized repo.
**Why it matters for CV/GitHub:** A clean commit history and no leaked secrets is table-stakes credibility.

---

## Phase 1 — Backend Modernization (TypeScript + Layered Architecture)

**Goal:** Turn the single-file API into a maintainable, type-safe, professionally structured backend.

- [x] Migrate backend to **TypeScript** (`tsconfig`, build scripts)
- [x] Adopt a layered architecture: `routes → controllers → services → repositories` (implemented as a generic, reusable CRUD engine in `src/core/`, configured per-resource in `src/resources/`)
- [x] Introduce a data layer with **migrations + type safety** — **Prisma** with a `PrismaPg` driver adapter, replacing raw `pg` queries; schema introspected from the live DB and baselined as the first migration
- [x] Author the 12-table schema as migrations + a **seed script** with realistic sample data (`prisma/seed.ts`)
- [x] Add **input validation** with **Zod** on all endpoints (per-resource create/update schemas)
- [x] Centralized **error-handling middleware** + consistent JSON response shape (`{ data }` / `{ error: { message, details } }`)
- [x] Structured **logging** (pino + pino-http) and environment-based config (validated via Zod in `src/config/env.ts`)
- [x] Security middleware: `helmet`, configured CORS, rate limiting (`express-rate-limit`)
- [x] Pagination, filtering, and sorting on list endpoints (`?page=&pageSize=&sort=field:asc|desc&<field>=value`)

**Deliverable:** A typed, layered REST API with validation, migrations, and seed data.
**CV impact:** "Refactored a monolithic script into a layered TypeScript REST API with schema migrations and request validation."

**Notes:**
- API moved from the old flat routes (`/customers`, `/add-customer`) to versioned RESTful routes under `/api/v1/*` (e.g. `GET/POST /api/v1/customers`, `GET/PATCH/DELETE /api/v1/customers/:customer_id`). The legacy vanilla-JS frontend targets the old routes and will be reconnected when it's rebuilt in Phase 6.
- The seed script wipes and repopulates all 12 tables — used deliberately in this session with the user's confirmation since the DB is a personal/team dev database, not shared production data.

---

## Phase 2 — Authentication & Authorization

**Goal:** Real users, real access control — the single biggest credibility upgrade.

- [x] User registration + login with **password hashing** (bcrypt via `bcryptjs`, 12 salt rounds)
- [x] **JWT** access + refresh token flow (refresh tokens hashed and stored server-side for rotation/revocation, not purely stateless)
- [x] **Role-based access control**: customer, restaurant owner, delivery agent, admin
- [x] Auth middleware protecting routes by role (`requireAuth` + `requireRole`, admin always allowed)
- [x] Ownership checks (a restaurant owner can only edit their own menu, a delivery agent only their own deliveries, etc.) — enforced generically via a `protect.ownerField` config per resource, not repeated per-route logic
- [ ] Password reset flow (optional, nice-to-have — deferred, not blocking)

**Deliverable:** Secure multi-role authentication system.
**CV impact:** "Implemented JWT-based authentication with role-based access control and per-resource ownership enforcement across four user roles."

**Notes:**
- New `users` + `refresh_tokens` tables added via an additive migration (no changes to existing data); `customers`/`restaurants`/`delivery_agents` each gained a nullable FK back to `users` (`user_id` / `owner_user_id`) so an auth identity is separate from — but linked to — its business profile.
- Admin accounts are intentionally **not** self-registerable via `/api/v1/auth/register` (only `customer`/`restaurant_owner`/`delivery_agent`) — seed script creates one admin account for testing.
- Two resources (`order-items`, `payments`) currently have role-only protection without a per-row `ownerField`, since verifying they belong to the caller's own order requires a join the generic ownership check doesn't support yet. Revisit once Phase 3 makes order placement a dedicated transactional endpoint.
- Reads (list/getOne) are public on every resource — matches typical food-delivery browsing UX (no login needed to browse restaurants/menus).
- Demo accounts for all four roles are seeded by `npm run seed` (password `Password123!` for all) — see the seed script's console output for the full list.

---

## Phase 3 — Real Domain Features (make it an actual app)

**Goal:** Move from "table CRUD dashboard" to a real food-ordering experience.

- [x] **Customer flow:** browse restaurants → view menu → add to cart → checkout → place order (checkout endpoint validates prices/availability server-side; frontend cart UI is still pending the Phase 6 React rebuild)
- [x] **Cart** logic (client + server validation of prices/availability) — server-side validation done via `POST /api/v1/orders/checkout`; enforces same-restaurant-per-order and item availability
- [x] **Order lifecycle state machine:** `placed → accepted → preparing → out_for_delivery → delivered` (+ cancelled), enforced via `PATCH /api/v1/orders/:order_id/status`
- [x] **Restaurant owner dashboard:** manage menu items (Phase 2), accept/update orders (`PATCH /orders/:id/status`), view all orders (`GET /restaurants/:id/orders`)
- [x] **Delivery agent view:** assigned deliveries via existing `GET /deliveries?agent_id=`, update status via `PATCH /api/v1/deliveries/:delivery_id/status` (auto-syncs the parent order's status)
- [x] **Reviews & ratings** tied to completed orders (enforce the 1–5 constraint, plus a business rule requiring a `delivered` order from that restaurant before reviewing)
- [x] **Search & filter** restaurants/menu items — generic `?search=` support added to the CRUD engine (case-insensitive `contains` across configured text fields)

**Deliverable:** An end-to-end ordering workflow with distinct role experiences.
**CV impact:** "Designed an order lifecycle state machine driving distinct customer, restaurant, and delivery workflows, with server-side cart validation and automatic cross-entity status sync."

**Notes:**
- The order and delivery state machines (`backend/src/orders/order-status.ts`) are deliberately hand-written rather than folded into the generic CRUD engine — lifecycle transitions carry business rules (which role may request which target state, ownership, legal transitions) that are clearer as explicit code than as configuration.
- Generic PATCH on `orders`/`deliveries` no longer accepts a `status`/`delivery_status` field — all lifecycle changes must go through the dedicated state-machine endpoints, closing off a bypass that would otherwise skip the transition rules.
- An order is restricted to items from a single restaurant (enforced at checkout) — this matches how food delivery actually works and keeps the restaurant-orders dashboard query simple.
- The original Phase 1 seed data had one order mixing items from two different restaurants (predating this rule); fixed during Phase 3 testing so seed data stays consistent with the new business rule.

---

## Phase 4 — Payments (Stripe Test Mode)

**Goal:** A believable, working checkout without handling real money.

- [x] Integrate **Stripe** in test mode (Payment Intents) — `POST /api/v1/payments/intent`, amount derived server-side, idempotent per order
- [x] Create payment on checkout; link payment records to orders (payment row created with the intent, carrying `stripe_payment_intent_id`)
- [x] Handle Stripe **webhooks** to confirm payment (`payment_intent.succeeded` / `.payment_failed`), signature-verified against the raw body
- [x] Graceful failure/refund handling — admin refund endpoint; and the whole module degrades to a clear 503 when Stripe keys aren't configured instead of crashing

**Deliverable:** Working test-mode payment flow.
**CV impact:** "Integrated Stripe (test mode) with webhook-driven order confirmation."

**Notes:**
- Additive migration added `payments.stripe_payment_intent_id` (unique).
- All business/ownership validation runs *before* Stripe is invoked, so the rules (ownership, already-paid, cancelled-order, amount) are enforceable and testable even without live keys. Verified end-to-end: 404 (no order), 403 (not your order), 409 (already paid), 503 (valid order, Stripe unconfigured), plus refund role-gating (403 for non-admin) and 422 (refunding a non-Stripe payment).
- Actual card-charge confirmation requires the user's own Stripe test keys + `stripe listen` webhook forwarding — documented in the README; not runnable in this environment.
- The generic `payments` CRUD create is now admin-only (real payments flow through the Stripe endpoints).

---

## Phase 5 — Real-Time Order & Delivery Tracking

**Goal:** A live, dynamic feature that demos really well.

- [x] Add **WebSockets** (Socket.IO) server-side — attached to the same HTTP server, JWT-authenticated at handshake
- [x] Push live **order status updates** to the customer — emitted from the order + delivery status services to the order's room
- [x] Live **delivery tracking** — delivery agents stream GPS via a `delivery:location` socket event, re-broadcast to that order's room (authorized: an agent can only push for their own delivery)
- [x] In-app **notifications** for status changes — order/delivery/payment status events all pushed to subscribers of the affected order

**Deliverable:** Real-time updates without page refresh.
**CV impact:** "Built real-time order tracking with WebSockets (Socket.IO)."

**Notes:**
- Architecture: a thin `backend/src/realtime/events.ts` holds the io reference + typed emit helpers; services import ONLY from there, never from socket.io directly. This keeps business logic decoupled from the transport and means the whole feature is a no-op (not a crash) if the socket server was never started.
- Authorization: clients must present a valid access token to connect, and can only `subscribe:order` to orders they're party to (customer who placed it / restaurant owner with an item on it / assigned delivery agent / admin) — same ownership logic as the REST layer, in `backend/src/realtime/order-access.ts`.
- Events: `order:status`, `delivery:status`, `delivery:location`, `payment:status`, all scoped to an `order:<id>` room.
- Verified end-to-end with a temporary socket.io-client script: invalid token rejected at handshake, authorized subscribe accepted, unrelated customer refused, and a live `order:status` event received by the customer when the restaurant owner accepted the order. (`socket.io-client` is kept as a devDependency for future real-time tests.)

---

## Phase 6 — Frontend Rebuild (React + TypeScript)

**Goal:** A modern, responsive UI worthy of a portfolio screenshot/GIF.

- [ ] Scaffold **Vite + React + TypeScript**
- [ ] **React Router** for pages; protected routes by role
- [ ] **TanStack Query** for server state; lightweight client state (Zustand) as needed
- [ ] Styling with **Tailwind CSS** (or a component library) — responsive, mobile-friendly
- [ ] Build screens: auth, restaurant list, menu, cart/checkout, order tracking, restaurant dashboard, admin
- [ ] Wire **Chart.js/Recharts to real data** (replace the current hardcoded mock analytics)
- [ ] Environment-based API URL (no hardcoded localhost)
- [ ] Loading, empty, and error states; form validation with feedback

**Deliverable:** A polished React SPA consuming the real API.
**CV impact:** "Built a responsive React + TypeScript SPA with server-state caching and role-based routing."

---

## Phase 7 — Testing & Code Quality

**Goal:** Demonstrate engineering discipline — a huge new-grad differentiator.

- [ ] Backend **unit + integration tests** (Vitest/Jest + Supertest) against a test DB
- [ ] Frontend **component tests** (Vitest + React Testing Library)
- [ ] At least one **E2E** happy-path test (Playwright) — e.g. register → order → pay
- [ ] **ESLint + Prettier** across both packages
- [ ] **Husky + lint-staged** pre-commit hooks
- [ ] Aim for meaningful coverage on core logic (services, state machine, auth)

**Deliverable:** A tested codebase with automated quality gates.
**CV impact:** "Wrote unit, integration, and E2E tests; enforced quality via linting and pre-commit hooks."

---

## Phase 8 — DevOps & Deployment (get it LIVE)

**Goal:** A clickable live demo — the thing recruiters actually open.

- [ ] **Dockerize** backend (and a `docker-compose` for local dev with Postgres)
- [ ] **GitHub Actions CI:** lint → typecheck → test → build on every PR
- [ ] **CD:** auto-deploy on merge to main
- [ ] Deploy backend (Render / Railway / Fly.io), frontend (Vercel / Netlify), DB stays on Neon
- [ ] Manage secrets via platform env vars; run migrations on deploy
- [ ] Seed a demo dataset + provide demo login credentials in the README

**Deliverable:** A live URL + green CI badge.
**CV impact:** "Containerized the app and set up CI/CD with GitHub Actions; deployed a live demo."

---

## Phase 9 — Documentation & Presentation (the CV/GitHub multiplier)

**Goal:** Make the repo *sell itself* in the first 15 seconds.

- [ ] **Killer README:** hero screenshot/GIF, live demo + demo credentials, feature list, tech stack badges, architecture diagram, setup steps
- [ ] **API documentation** via Swagger/OpenAPI (interactive docs endpoint)
- [ ] **ER diagram** of the database (regenerate from the schema)
- [ ] Architecture diagram (frontend ↔ API ↔ DB ↔ Stripe ↔ WebSocket)
- [ ] Screenshots/GIFs of key flows in `docs/`
- [ ] Clean up commit history; write a short "What I learned / built" section
- [ ] Finalize polished **CV bullet points** (draft below)

**Deliverable:** A repo that reads as a professional product.
**CV impact:** This is where all the prior work becomes *legible* to a recruiter.

---

## Draft CV Bullet Points (finalize after Phase 9)

> Refine these to match exactly what ends up implemented.

- Built **BiteDash**, a full-stack food-delivery platform (React + TypeScript, Node/Express + TypeScript, PostgreSQL) with a **live deployment** and CI/CD pipeline.
- Designed a normalized **12-table PostgreSQL schema** with versioned migrations, then exposed it through a **layered, type-safe REST API** with request validation and centralized error handling.
- Implemented **JWT authentication with role-based access control** for four user roles (customer, restaurant, delivery agent, admin).
- Built a complete **order lifecycle** with a state machine, **Stripe test-mode payments** (webhook-driven), and **real-time tracking over WebSockets**.
- Established engineering quality via **unit, integration, and E2E tests**, ESLint/Prettier, pre-commit hooks, and **GitHub Actions CI/CD** with Docker.

---

## Suggested Order & Pacing

Phases are numbered in dependency order, but you can ship value incrementally:

1. **Phase 0** — do immediately (safety + git).
2. **Phases 1–2** — the backbone (typed API + auth). Highest engineering signal.
3. **Phase 3** — makes it a real app.
4. **Phases 6** — rebuild the frontend once the API is stable (can overlap with 4/5).
5. **Phases 4–5** — impressive features (payments, real-time).
6. **Phases 7–8** — quality + deploy (do 8 early enough to keep a live demo throughout).
7. **Phase 9** — continuous, but finalize last.

> **Tip:** Deploy something *early* (end of Phase 2 or 3). A live demo that grows over time beats a
> perfect app that never ships.
