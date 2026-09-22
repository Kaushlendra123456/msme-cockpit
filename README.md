# MSME AI Operating Cockpit - Codebase

A working, containerizable prototype implementing the core MSME ERP modules plus a rule-based
intelligence layer, a customer credit ledger, notifications, data export/backup, automated
tests, structured logging, API documentation, and CI/CD.

## What's Fully Working

### Core Operations
- Multi-tenant auth (JWT) + role-based access (Owner/Manager/Staff)
- Business profile management
- Product & category CRUD
- Inventory ledger (auto stock update on sale/purchase, manual adjustment)
- Sales (POS billing screen) with automatic GST calculation
- Purchases (auto stock increment)
- Expenses tracking + category-wise report
- Customer CRM with rule-based tagging (high-value / inactive)
- Supplier recommendation - rule-based scoring (rating + delivery speed)
- Dashboard with real financial/sales/inventory aggregates + revenue trend chart

### Customer Credit Ledger (new)
- Record a sale as "on credit" (Pending/Partial payment) directly from the POS screen
- Automatic credit-limit enforcement - a sale that would exceed a customer's limit is blocked
- Payment recording against outstanding credit
- Full ledger history per customer

### Intelligence Layer
- **Smart Reorder Engine** - rule-based (avg daily sales × supplier lead time)
- **Business Health Score** - rule-based composite (revenue growth, margin, inventory, expense control)
- **Cash Flow Forecast** - linear-trend baseline model (Python/FastAPI), now connected end-to-end
  to a chart on the Insights page (Node backend aggregates history and proxies to the AI service)

### Notifications
- Automatic low-stock / out-of-stock / new-sale notifications, generated from real inventory
  and sales events (not a scheduled poll)
- Bell icon in the navbar with unread count, dropdown, and mark-as-read

### Data Export & Backup
- CSV export for Sales, Products, Customers, and Expenses (Reports page)
- Full PostgreSQL backup via `pg_dump`, downloadable from Settings (Owner only)

### Engineering Quality
- **Automated tests**: 10 Jest tests (backend - GST calculation, credit limit logic) + 6 Pytest
  tests (AI service - forecasting model), all passing
- **Structured logging** (Pino) - every request and error is logged as JSON
- **API documentation** - OpenAPI 3.0 spec served at `/api-docs`
- **Production Dockerfiles** for all three services (Node backend, FastAPI AI service, React
  frontend via nginx) - see `docker-compose.prod.yml` for running the whole stack containerized
- **CI pipeline** (GitHub Actions) - type-checks, tests, and builds all three services plus
  their Docker images on every push/PR

## Intentionally Not Included

These need external accounts/credentials that can't be faked into working code:

- **Payment Gateway** - `payment.controller.ts` has a clearly-marked Razorpay stub
- **AI Business Advisor (RAG + LLM)** - needs an LLM API key + embeddings pipeline
- **WhatsApp Automation** - needs WhatsApp Business API approval
- **Voice Assistant, Digital Twin, Barcode scanning, PWA offline mode** - Tier 3, not built yet

## Project Structure

```
msme-cockpit/
├── docker-compose.yml         # Postgres + Redis + pgAdmin for local dev (app runs natively)
├── docker-compose.prod.yml    # Full stack containerized (Postgres, Redis, api, ai-service, web)
├── .env.prod.example          # Template for production secrets (copy to .env.prod, don't commit it)
├── .github/workflows/ci.yml   # CI: test + build + Docker image validation
└── apps/
    ├── api/                  # Node.js + Express + TypeScript + Prisma backend
    │   ├── openapi.yaml       # API documentation source (served at /api-docs)
    │   ├── tests/             # Jest unit tests
    │   └── Dockerfile
    ├── ai-service/            # Python + FastAPI forecasting service
    │   ├── tests/             # Pytest unit tests
    │   └── Dockerfile
    └── web/                   # React + TypeScript + Tailwind frontend
        └── Dockerfile         # Multi-stage build served via nginx
```

## Local Development (Native, Fastest Iteration)

### 1. Start the database
```bash
docker compose up -d
```

### 2. Backend
```bash
cd apps/api
cp .env.example .env
npm install
npm run prisma:migrate
npm run dev                # http://localhost:4000
npm test                   # run the Jest suite
```
API docs: `http://localhost:4000/api-docs`

### 3. AI Service
```bash
cd apps/ai-service
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements-dev.txt
uvicorn app.main:app --reload --port 8000
pytest tests/ -v            # run the test suite
```

### 4. Frontend
```bash
cd apps/web
cp .env.example .env
npm install
npm run dev                 # http://localhost:5173
```

## Fully Containerized (Production-style)

```bash
cp .env.prod.example .env.prod   # fill in real secrets, never commit this file
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build
```

This builds and runs all four services (Postgres, Redis, api, ai-service, web) as containers.
The frontend is served by nginx on port 80; the API on 4000; the AI service on 8000.

Run migrations against the containerized database once it's up:
```bash
docker exec -it msme_api_prod npx prisma migrate deploy
```

## What To Build Next

1. Real Razorpay integration in `payment.controller.ts` (needs a Razorpay account)
2. GST-compliant PDF invoice generation for each sale
3. AI Business Advisor: pick an LLM provider, build the embeddings pipeline, complete the
   `advisor_conversations` flow end-to-end
4. Expand automated tests to cover the sale/inventory transaction flow end-to-end (currently
   only pure-logic units are tested; integration tests need a test database - the CI pipeline
   already spins one up, so this is the natural next addition)
5. Formal documentation: C4 architecture diagrams, threat model, evaluation dossier - see the
   separate architecture document for the full picture

## A Note on Scope

This is a working prototype with real engineering practices layered on top - not the complete
long-term product vision. Features like WhatsApp automation, the voice assistant, the RAG-based
advisor, and the digital twin simulator each require external service accounts and are better
built as focused, dedicated phases.
