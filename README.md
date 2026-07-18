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

- **Backend:** Node.js, Express
- **Database:** PostgreSQL (hosted on [Neon](https://neon.tech))
- **Frontend:** HTML, CSS, JavaScript *(migrating to React + TypeScript — see roadmap)*

## Project Structure

```
.
├── backend/    # Express REST API
├── frontend/   # Client application
├── docs/       # Project documentation (including the original coursework report)
└── PROJECT_ROADMAP.md
```

## Getting Started

### Backend

```bash
cd backend
npm install
cp .env.example .env   # fill in your own PostgreSQL connection string
npm start
```

### Frontend

Open `frontend/index.html` in a browser, or serve the `frontend/` directory with any
static file server. *(This will change once the frontend is migrated to a proper build
setup — see the roadmap.)*

## Documentation

- [Project Roadmap](PROJECT_ROADMAP.md) — phased plan for turning this into a portfolio-grade project
- [Original Coursework Report](docs/Online_Food_Delivery_Project_Report.pdf) — the initial academic project report and database design

## License

MIT — see [LICENSE](LICENSE).
