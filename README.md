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
