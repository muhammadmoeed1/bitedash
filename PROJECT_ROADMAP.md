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
| Backend | Single 591-line `index.js`, Express 5, raw `pg`, 48 CRUD endpoints | Layered TypeScript API (routes → controllers → services → repositories) |
| Auth | None | JWT auth + role-based access (customer / restaurant / rider / admin) |
| Frontend | 1 static HTML page, vanilla JS, hardcoded `localhost:6006` | React + TypeScript SPA, real ordering flow |
| Database | 12-table PostgreSQL (Neon), schema only in PDF | Same schema, versioned via migrations + seed data |
| Payments | "Payments" table, no processing | Stripe test-mode checkout + webhooks |
| Real-time | None | WebSocket order/delivery tracking |
| Tests | None | Backend + frontend tests, CI-gated |
| DevOps | None | Docker, GitHub Actions CI/CD, live deploy |
| Docs | 25-page PDF, no README | Rich README, API docs, ER diagram, live demo link |
| Version control | No git repo | Clean, meaningful commit history |

---

## Phase 0 — Foundation & Safety Net ⚠️ (do this first)

**Goal:** Get the project under version control, remove the security landmine, and set up a clean structure.

- [ ] Initialize a git repository and make an initial commit of the current state
- [ ] Add a proper `.gitignore` (node_modules, `.env`, build output, etc.)
- [ ] **Remove the committed `.env` / DB credentials from the repo and rotate the Neon password** (secrets are currently in plaintext — treat them as compromised)
- [ ] Add `.env.example` files documenting required variables (no real values)
- [ ] Restructure into a clear layout (e.g. `backend/`, `frontend/`, `docs/`)
- [ ] Add `LICENSE` (MIT is a safe default) and a minimal `README.md` placeholder
- [ ] Create the GitHub repository and push

**Deliverable:** A safe, versioned, well-organized repo.
**Why it matters for CV/GitHub:** A clean commit history and no leaked secrets is table-stakes credibility.

---

## Phase 1 — Backend Modernization (TypeScript + Layered Architecture)

**Goal:** Turn the single-file API into a maintainable, type-safe, professionally structured backend.

- [ ] Migrate backend to **TypeScript** (`tsconfig`, build scripts)
- [ ] Adopt a layered architecture: `routes → controllers → services → repositories`
- [ ] Introduce a data layer with **migrations + type safety** — recommend **Prisma** (or Drizzle) to replace raw SQL, get a versioned schema, and generate types from the DB
- [ ] Author the 12-table schema as migrations + a **seed script** with realistic sample data
- [ ] Add **input validation** with **Zod** on all endpoints
- [ ] Centralized **error-handling middleware** + consistent JSON response shape
- [ ] Structured **logging** (pino) and environment-based config
- [ ] Security middleware: `helmet`, configured CORS, rate limiting
- [ ] Pagination, filtering, and sorting on list endpoints

**Deliverable:** A typed, layered REST API with validation, migrations, and seed data.
**CV impact:** "Refactored a monolithic script into a layered TypeScript REST API with schema migrations and request validation."

---

## Phase 2 — Authentication & Authorization

**Goal:** Real users, real access control — the single biggest credibility upgrade.

- [ ] User registration + login with **password hashing** (argon2 / bcrypt)
- [ ] **JWT** access + refresh token flow
- [ ] **Role-based access control**: customer, restaurant owner, delivery agent, admin
- [ ] Auth middleware protecting routes by role
- [ ] Ownership checks (a restaurant owner can only edit their own menu, etc.)
- [ ] Password reset flow (optional, nice-to-have)

**Deliverable:** Secure multi-role authentication system.
**CV impact:** "Implemented JWT-based authentication with role-based access control across four user roles."

---

## Phase 3 — Real Domain Features (make it an actual app)

**Goal:** Move from "table CRUD dashboard" to a real food-ordering experience.

- [ ] **Customer flow:** browse restaurants → view menu → add to cart → checkout → place order
- [ ] **Cart** logic (client + server validation of prices/availability)
- [ ] **Order lifecycle state machine:** `placed → accepted → preparing → out_for_delivery → delivered` (+ cancelled)
- [ ] **Restaurant owner dashboard:** manage menu items, accept/update orders
- [ ] **Delivery agent view:** assigned deliveries, update status
- [ ] **Reviews & ratings** tied to completed orders (enforce the 1–5 constraint)
- [ ] **Search & filter** restaurants/menu items

**Deliverable:** An end-to-end ordering workflow with distinct role experiences.
**CV impact:** "Designed an order lifecycle state machine driving distinct customer, restaurant, and delivery workflows."

---

## Phase 4 — Payments (Stripe Test Mode)

**Goal:** A believable, working checkout without handling real money.

- [ ] Integrate **Stripe** in test mode (Checkout or Payment Intents)
- [ ] Create payment on checkout; link payment records to orders
- [ ] Handle Stripe **webhooks** to confirm payment and advance order state
- [ ] Graceful failure/refund handling

**Deliverable:** Working test-mode payment flow.
**CV impact:** "Integrated Stripe (test mode) with webhook-driven order confirmation."

---

## Phase 5 — Real-Time Order & Delivery Tracking

**Goal:** A live, dynamic feature that demos really well.

- [ ] Add **WebSockets** (Socket.IO) server-side
- [ ] Push live **order status updates** to the customer
- [ ] Live **delivery tracking** (simulated location updates from the rider view are fine)
- [ ] In-app **notifications** for status changes

**Deliverable:** Real-time updates without page refresh.
**CV impact:** "Built real-time order tracking with WebSockets (Socket.IO)."

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
