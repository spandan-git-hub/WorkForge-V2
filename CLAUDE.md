# WorkForge — Assistant Instructions (CLAUDE.md)

This repository contains **WorkForge**, an AI-powered career development platform for software engineers.

---

## 1. Documentation Hierarchy & Source of Truth

Always adhere to the designated source files for architectural and implementation details:

- **[BACKEND.md](file:///d:/WorkForge/BACKEND.md)**: **Source of truth for the backend**.
  - Database schema, table definitions, relationships, and constraints.
  - FastAPI routers, services, dependencies, and Pydantic v2 schemas.
  - ML pipeline implementation (Gap Analysis, Recommender, Resource Suggester).
  - Authentication flow, JWT configuration, and error handling conventions.

- **[FRONTEND.md](file:///d:/WorkForge/FRONTEND.md)**: **Source of truth for the frontend**.
  - Component hierarchy, design tokens, and TailwindCSS v4 setup.
  - Routing structure, protected routes, and AuthContext.
  - TanStack Query cache keys, Axios client interceptors, and API client methods.
  - UI primitives, layout wrappers, charts, and forms.

- **[PRIORITY.md](file:///d:/WorkForge/PRIORITY.md)**: **Master implementation guide & progress tracker**.
  - Detailed, phase-by-phase roadmap (Phases 1 through 12).
  - Clear separation between backend and frontend steps.

---

## 2. Tracking Progress & Phase Completion Rule

> [!IMPORTANT]
> **Mandatory Progress Updates**:
> 1. **Check Status First**: Before starting any task, inspect `PRIORITY.md` to determine the current active phase and exact pending steps.
> 2. **Follow Phase Order**: Complete phases sequentially. Do not jump ahead or mix backend and frontend code arbitrarily.
> 3. **Update Status Immediately**: Upon completing all requirements and verifications of a phase, **you MUST update the status table in [PRIORITY.md](file:///d:/WorkForge/PRIORITY.md)**, marking that phase as `✅ Completed`.

---

## 3. Tech Stack Overview

- **Frontend**: React 19, Vite, TailwindCSS v4, TanStack Query, React Hook Form, Zod, Recharts, Axios.
- **Backend**: Python 3.12 / 3.13, FastAPI, SQLAlchemy 2.0 (async), Alembic, asyncpg, PostgreSQL 18+, scikit-learn, Pydantic v2.
- **Deployment**: Vercel (frontend) + Render (backend & database).

---

## 4. Key Development Commands

### Backend (`backend/`)

```bash
# Activate virtual environment (Windows PowerShell)
.\.venv\Scripts\Activate.ps1

# Run development server
uvicorn app.main:app --reload --port 8000

# Database migrations
alembic revision --autogenerate -m "migration description"
alembic upgrade head
alembic current

# Seed database
python -m app.db.seed

# Run tests
pytest
```

### Frontend (`frontend/`)

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

---

## 5. Coding & Workflow Principles

- **Separation of Concerns**: Never make frontend directly query the database or call internal backend functions. All data exchange occurs via `/api/v1` REST endpoints.
- **Async by Default**: All backend database queries and route handlers must use `async`/`await` with SQLAlchemy `AsyncSession`.
- **Validation**: Strict schema validation using Pydantic v2 on backend and Zod on frontend.
- **No Git Commits Without Permission**: **NEVER run `git commit` or create commits without the user's explicit instruction and permission.** Do not automatically commit when completing phases or steps.

---

## 6. Testing & Verification Rules

- **No Browser Automation / Opening**: Do NOT open the browser or use browser subagents/browser opening tools to run tests or perform verification.
- **Verification Method**: Always verify changes via command-line tools: automated test suites (`pytest` for backend), compiler and build checks (`npm run build` for frontend), and direct programmatic assertions.
