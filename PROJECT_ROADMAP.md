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

| Area            | Today                                                                                                          | Target                                                               |
| --------------- | -------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| Backend         | Layered TypeScript API (routes → controllers → services → repositories), generic CRUD engine over 12 resources | ✅ Done — next: harden per business rules as real features land      |
| Auth            | None                                                                                                           | JWT auth + role-based access (customer / restaurant / rider / admin) |
| Frontend        | 1 static HTML page, vanilla JS, hardcoded `localhost:6006`                                                     | React + TypeScript SPA, real ordering flow                           |
| Database        | 12-table PostgreSQL (Neon), schema versioned via Prisma migrations + seed script                               | ✅ Done                                                              |
| Payments        | "Payments" table, no processing                                                                                | Stripe test-mode checkout + webhooks                                 |
| Real-time       | None                                                                                                           | WebSocket order/delivery tracking                                    |
| Tests           | None                                                                                                           | Backend + frontend tests, CI-gated                                   |
| DevOps          | None                                                                                                           | Docker, GitHub Actions CI/CD, live deploy                            |
| Docs            | 25-page PDF, no README                                                                                         | Rich README, API docs, ER diagram, live demo link                    |
| Version control | No git repo                                                                                                    | Clean, meaningful commit history                                     |

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
- All business/ownership validation runs _before_ Stripe is invoked, so the rules (ownership, already-paid, cancelled-order, amount) are enforceable and testable even without live keys. Verified end-to-end: 404 (no order), 403 (not your order), 409 (already paid), 503 (valid order, Stripe unconfigured), plus refund role-gating (403 for non-admin) and 422 (refunding a non-Stripe payment).
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

- [x] Scaffold **Vite + React + TypeScript**
- [x] **React Router** for pages; protected routes by role (`ProtectedRoute` with a `roles` allow-list)
- [x] **TanStack Query** for server state; **Zustand** for auth session + a persisted cart
- [x] Styling with **Tailwind CSS v4** — responsive, mobile-friendly, shared UI primitives
- [x] Build screens: auth (login/register), restaurant list + search, menu, cart, checkout, live order tracking, restaurant dashboard, delivery dashboard, admin
- [x] Wire **Recharts to real data** (orders-by-status + payments-by-status, computed live from the API — no mock data); palette validated with the dataviz colorblind-safe checker
- [x] Environment-based API URL (`VITE_API_URL`; dev uses a Vite proxy so no hardcoded localhost in code)
- [x] Loading, empty, and error states; form validation with feedback; axios auth interceptor with transparent token refresh

**Deliverable:** A polished React SPA consuming the real API.
**CV impact:** "Built a responsive React + TypeScript SPA with server-state caching and role-based routing."

**Notes:**

- The legacy vanilla-JS coursework frontend was archived to `docs/legacy-frontend/`; the new app is a fresh Vite + React + TS project in `frontend/`.
- Live order tracking (`src/hooks/useOrderRealtime.ts`) consumes the Phase 5 Socket.IO events — a customer watching an order sees status changes and the delivery agent's simulated GPS pings update in real time.
- Route-level code-splitting keeps Recharts in its own chunk (main bundle ~394 KB, admin/charts chunk ~377 KB loaded only when an admin opens analytics).
- Verified: production build passes (`tsc -b && vite build`), the dev server serves the app, and API calls proxy through to the backend returning live data. Visual pixel-level review wasn't possible in this environment — worth a manual once-over in a browser and capturing screenshots/GIFs for the README (Phase 9).

---

## Phase 7 — Testing & Code Quality

**Goal:** Demonstrate engineering discipline — a huge new-grad differentiator.

- [x] Backend **unit + integration tests** (Vitest + Supertest) — 49 tests, no live DB required (see notes)
- [x] Frontend **component tests** (Vitest + React Testing Library) — 17 tests
- [x] At least one **E2E** happy-path test (Playwright) — added in Phase 9 once a verified browser environment was confirmed (see Phase 9 notes)
- [x] **ESLint + Prettier** across both packages
- [x] **Husky + lint-staged** pre-commit hooks
- [x] Meaningful coverage on core logic: state machines, password/JWT, generic CRUD engine (pagination/filter/search/ownership/hooks), full auth HTTP journey

**Deliverable:** A tested codebase with automated quality gates.
**CV impact:** "Wrote unit and integration tests with mocked data layers (no live DB needed in CI), enforced quality via ESLint/Prettier and pre-commit hooks."

**Notes:**

- **Test strategy — no live database required.** Neon's pooled connection is slow and unreliable for rapid test iteration (see Phase 1–3 notes), so instead of a real test DB: (1) unit tests use a hand-written in-memory fake Prisma delegate (`core/service.test.ts`) to exercise the generic CRUD engine — pagination, filtering, search, sorting, ownership enforcement, business-rule hooks — with zero DB dependency; (2) the auth integration test (`auth/auth.routes.test.ts`) mocks the whole `lib/prisma` module with an in-memory store and drives real HTTP requests through the actual Express app via Supertest (register → duplicate-rejected → wrong-password-rejected → login → `/me` → refresh-rotation → reuse-rejected → logout → post-logout-refresh-rejected). This is also a deliberate CI advantage (Phase 8): these tests need no `DATABASE_URL` secret and can't flake on network/Neon cold-starts.
- Backend `typescript` was downgraded from the bleeding-edge 7.x (Go-based) compiler to the latest stable 5.9.3 specifically because `typescript-eslint` cannot yet parse TS7 projects at all (a hard incompatibility, not a lint-rule issue) — a good example of choosing ecosystem compatibility over being on the newest possible tool.
- `tsconfig.build.json` excludes `*.test.ts` from the production build; the base `tsconfig.json` (used for `typecheck`) still includes them.
- ESLint config note: `eslint-plugin-react-hooks` v7's "recommended" preset assumes React Compiler adoption (rules like `purity`, `set-state-in-render`, etc.) — this project doesn't use the Compiler yet, so one legitimate false-positive (a simulated-GPS demo button using `Math.random()` in a click handler) is disabled with a scoped, commented `eslint-disable` rather than silencing the rule project-wide.
- **E2E (Playwright) deferred at the time this phase was written**: this environment had no confirmed browser/display support to verify a real Playwright run end-to-end, and claiming it works without having actually run it would have been dishonest. Confirmed working in Phase 9 (headless Chromium runs fine here) — the actual test was added then, see Phase 9 notes.
- Husky + lint-staged run from the repo root (`package.json`, `.husky/pre-commit`, `lint-staged.config.cjs`) since git hooks are repo-wide, not per-package — `backend/` and `frontend/` are two independent npm projects, not a workspace, so lint-staged invokes each package's own locally-installed `eslint`/`prettier` binaries directly with explicit repo-root-relative paths (learned that `npm --prefix <dir> exec` does _not_ change the child process's actual working directory, only npm's package-resolution context — a real gotcha worth remembering).

---

## Phase 8 — DevOps & Deployment (get it LIVE)

**Goal:** A clickable live demo — the thing recruiters actually open.

- [x] **Dockerize** backend (multi-stage `backend/Dockerfile`) and a `docker-compose.yml` for local dev with Postgres
- [x] **GitHub Actions CI:** lint → typecheck → test → build on every push/PR — verified green on a real run (both backend and frontend jobs)
- [x] **CD:** auto-deploy on merge to main — handled by Render's/Vercel's own GitHub integration once connected, no custom Actions workflow needed
- [ ] Deploy backend (Render), frontend (Vercel), DB stays on Neon — **config is ready (`render.yaml`, `frontend/vercel.json`), but actually connecting the accounts is a step only the project owner can do** (see notes)
- [x] Manage secrets via platform env vars; run migrations on deploy (`prisma migrate deploy` runs automatically in the container's start command)
- [x] Seed a demo dataset + provide demo login credentials in the README (done back in Phase 1/2 — `npm run seed`, password `Password123!` for every role)

**Deliverable:** A live URL + green CI badge.
**CV impact:** "Containerized the app and set up CI/CD with GitHub Actions; deployed a live demo."

**Notes:**

- **CI is genuinely verified**, not just written: pushed and watched run [29850521166](https://github.com/muhammadmoeed1/bitedash/actions/runs/29850521166) go green for both jobs. It needs zero secrets because of the Phase 7 testing design (mocked Prisma, no live DB).
- **Local Docker build was NOT verified in this session** — Docker Desktop's backend engine was returning API-version-mismatch 500 errors throughout, unrelated to this project's config. Worth running `docker compose up --build` yourself to confirm before relying on it.
- **Actual deployment (a live URL) requires the project owner's own accounts** on Render and Vercel — this assistant can't sign up for hosting accounts on someone else's behalf (same category of limitation as Stripe test keys in Phase 4). Everything needed to deploy in a few clicks is committed: `render.yaml` (Blueprint), `frontend/vercel.json` (SPA rewrite), and step-by-step instructions in the README's "CI/CD & Deployment" section.

---

## Phase 9 — Documentation & Presentation (the CV/GitHub multiplier)

**Goal:** Make the repo _sell itself_ in the first 15 seconds.

- [x] **Killer README:** hero screenshot gallery, feature list, tech stack, architecture diagram, setup steps (live demo link still pending actual Render/Vercel deployment — see Phase 8 notes)
- [x] **API documentation** via Swagger/OpenAPI (interactive docs endpoint at `/api-docs`)
- [x] **ER diagram** of the database (`docs/ER_DIAGRAM.md`)
- [x] Architecture diagram (`docs/ARCHITECTURE.md` — system diagram + request-flow sequence diagram)
- [x] Screenshots of key flows in `docs/screenshots/` (10 real, captured screenshots — see notes)
- [x] Write a short "What I Built & Learned" section (in the README)
- [x] Finalize polished **CV bullet points** (below)

**Deliverable:** A repo that reads as a professional product.
**CV impact:** This is where all the prior work becomes _legible_ to a recruiter.

**Notes:**

- **Screenshots are real, not mocked up.** Captured with a headless-Chromium Playwright script driving the actual running app (both dev servers + the real seeded Neon database) — login as each of the four demo roles, browse → cart → checkout → place an order → live tracking, restaurant/delivery/admin dashboards. This also surfaced and fixed two real bugs: (1) `OrderTracking.tsx` was rendering item lines as `item #10` instead of the real name — `order-items` only carries `item_id`, so the page now resolves names via a follow-up `/menu-items/:id` fetch; (2) the capture script itself needed patient `waitForURL`-based waits instead of fixed timeouts, because Neon's serverless Postgres can cold-start (multi-second first-query latency) after being idle, which had been silently producing a screenshot of the login page where the checkout page was expected.
- **OpenAPI docs are generated, not hand-duplicated**: `backend/src/docs/openapi.ts` builds the document straight from each resource's existing `ResourceConfig` (Zod schemas via `z.toJSONSchema`, `protect` roles, `filterableFields`) plus hand-authored paths for the workflow endpoints (auth, checkout, status transitions, payments) — so the docs can't silently drift from the real validation/auth rules the way hand-written API docs tend to.
- **The Playwright E2E test** (`frontend/e2e/happy-path.spec.ts`) reuses the same patient-navigation lesson from the screenshot script and is intentionally excluded from CI (needs a live, seeded database) — see Phase 7 notes for why CI stays DB-free.

---

## Final CV Bullet Points

- Built **BiteDash**, a full-stack food-delivery platform (React + TypeScript, Node/Express + TypeScript, PostgreSQL) with Docker, CI/CD, and OpenAPI-documented REST API.
- Designed a normalized **12-table PostgreSQL schema** with versioned migrations, then exposed it through a **layered, type-safe REST API** — a generic CRUD engine configured per-resource — with Zod request validation and centralized error handling.
- Implemented **JWT authentication with role-based access control** (short-lived access tokens + rotating/revocable refresh tokens) for four user roles (customer, restaurant, delivery agent, admin), including per-resource ownership enforcement.
- Built a complete **order lifecycle** with an explicit state machine, **Stripe test-mode payments** (webhook-driven, idempotent), and **real-time order/delivery tracking over WebSockets** (Socket.IO).
- Established engineering quality via **unit, integration, and end-to-end tests** (Vitest, Supertest, Playwright), ESLint/Prettier, pre-commit hooks, and a **GitHub Actions CI pipeline** verified green with zero live-database dependency.
- Generated **interactive API documentation** (Swagger/OpenAPI) directly from the same schemas that validate requests, plus architecture and ER diagrams, keeping docs and implementation from drifting apart.

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

> **Tip:** Deploy something _early_ (end of Phase 2 or 3). A live demo that grows over time beats a
> perfect app that never ships.
