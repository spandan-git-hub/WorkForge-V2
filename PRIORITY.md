# WorkForge — Step-by-Step Implementation Guide

This is the master implementation guide. Follow each phase in order. Each phase is split into **Backend** and **Frontend** steps clearly — never mix them. Complete a phase fully before moving to the next.

**Stack:** React 19 + Vite + TailwindCSS v4 | FastAPI + PostgreSQL + scikit-learn  
**Deployment:** Vercel (frontend) + Render (backend)

---

## Quick Reference

| Phase | What Gets Built | Status |
|-------|----------------|--------|
| Phase 1 | Project scaffolding & repo setup | ✅ Completed |
| Phase 2 | Database schema + migrations | ✅ Completed |
| Phase 3 | Authentication (register, login, JWT) | ✅ Completed |
| Phase 4 | User profile (read + update) | ✅ Completed |
| Phase 5 | Skill inventory (CRUD + catalog) | ✅ Completed |
| Phase 6 | Events (browse, filter, interest tracking) | ✅ Completed |
| Phase 7 | ML — Gap Analysis | ✅ Completed |
| Phase 8 | ML — Skill Recommender | ✅ Completed |
| Phase 9 | ML — Resource Suggester | ✅ Completed |
| Phase 10 | Dashboard (summary view) | ✅ Completed |
| Phase 11 | Polish, error handling, loading states | |
| Phase 12 | Deployment — Render + Vercel | |

---

## Phase 1 — Project Scaffolding & Repo Setup

> Goal: Both frontend and backend run locally, hello-world responses working, git repo initialized.

### Step 1.1 — Create GitHub Repo & Root Structure

1. Create a new GitHub repository called `workforge`.
2. Clone it locally.
3. Create this folder structure at the root:
   ```
   workforge/
   ├── frontend/
   ├── backend/
   └── README.md
   ```
4. Create a root `.gitignore` that covers both Python and Node:
   ```
   # Python
   __pycache__/
   *.py[cod]
   .venv/
   *.env
   *.joblib
   *.pkl

   # Node
   node_modules/
   dist/
   .env

   # OS
   .DS_Store
   Thumbs.db
   ```
5. Initial commit: `git commit -m "chore: initial repo structure"`.

---

### Step 1.2 — BACKEND: Scaffold FastAPI Project

1. Inside `backend/`, create a Python virtual environment:
   ```bash
   python -m venv .venv
   source .venv/bin/activate    # Windows: .venv\Scripts\activate
   ```
2. Create `backend/requirements.txt` with these initial dependencies:
   ```
   fastapi==0.115.0
   uvicorn[standard]==0.30.0
   sqlalchemy[asyncio]==2.0.36
   asyncpg==0.30.0
   alembic==1.14.0
   pydantic==2.10.0
   pydantic-settings==2.6.0
   python-jose[cryptography]==3.3.0
   passlib[bcrypt]==1.7.4
   python-multipart==0.0.17
   httpx==0.28.0
   pytest==8.3.0
   pytest-asyncio==0.24.0
   scikit-learn==1.5.2
   pandas==2.2.3
   numpy==2.1.3
   joblib==1.4.2
   ```
3. Install: `pip install -r requirements.txt`.
4. Create the full folder structure inside `backend/` as defined in `BACKEND.md` Section 1.
5. Create `backend/app/main.py` with a minimal FastAPI app:
   ```python
   from fastapi import FastAPI

   app = FastAPI(title="WorkForge API", version="1.0.0")

   @app.get("/")
   def root():
       return {"message": "WorkForge API is running"}

   @app.get("/health")
   def health():
       return {"status": "ok"}
   ```
6. Create `backend/app/core/config.py` with Pydantic Settings (as in `BACKEND.md` Section 8).
7. Create `backend/.env` with placeholder values:
   ```
   DATABASE_URL=postgresql+asyncpg://postgres:password@localhost:5432/workforge
   JWT_SECRET=changethis_use_a_long_random_string
   JWT_EXPIRY_DAYS=7
   FRONTEND_URL=http://localhost:5173
   ENVIRONMENT=development
   ```
8. Create `backend/.env.example` (copy of `.env` with values blanked out).
9. Run the server: `uvicorn app.main:app --reload --port 8000`.
10. Verify: `GET http://localhost:8000/health` returns `{"status": "ok"}`.
11. Verify: `GET http://localhost:8000/docs` opens Swagger UI.

---

### Step 1.3 — FRONTEND: Scaffold React + Vite Project

1. Inside the `frontend/` directory, scaffold with Vite:
   ```bash
   npm create vite@latest . -- --template react
   ```
2. Install dependencies:
   ```bash
   npm install
   npm install react-router-dom @tanstack/react-query axios react-hook-form zod @hookform/resolvers recharts
   ```
3. Install TailwindCSS v4:
   ```bash
   npm install tailwindcss @tailwindcss/postcss autoprefixer postcss
   ```
4. Create `postcss.config.cjs`:
   ```js
   module.exports = {
     plugins: {
       '@tailwindcss/postcss': {},
       autoprefixer: {},
     },
   }
   ```
5. Replace `src/index.css` content with the full Tailwind config from `FRONTEND.md` Section 8 (design tokens + `@import "tailwindcss"`).
6. Add Google Fonts import to `index.html` `<head>`:
   ```html
   <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
   ```
7. Create `frontend/.env`:
   ```
   VITE_API_URL=http://localhost:8000
   ```
8. Create `frontend/.env.example` (same, value blanked).
9. Create `frontend/vercel.json`:
   ```json
   {
     "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
   }
   ```
10. Clear out the default Vite boilerplate from `App.jsx` and `App.css` (delete App.css).
11. Replace `src/main.jsx` with a minimal entry that wraps `<App />` in `<QueryClientProvider>` and `<AuthProvider>` (stubs for now — to be filled later).
12. Run: `npm run dev`. Verify app loads at `http://localhost:5173` with no errors.

---

### Step 1.4 — Create Full Source Folder Structure (Frontend)

Create all the empty folders and placeholder index files as defined in `FRONTEND.md` Section 1:
- `src/api/`, `src/components/ui/`, `src/components/layout/`, `src/components/auth/`, `src/components/skills/`, `src/components/ml/`, `src/components/events/`
- `src/pages/auth/`, `src/pages/dashboard/`, `src/pages/profile/`, `src/pages/skills/`, `src/pages/ml/`, `src/pages/events/`
- `src/hooks/`, `src/context/`, `src/store/`, `src/utils/`

Commit: `git commit -m "chore: scaffold frontend and backend"`.

---

## Phase 2 — Database Setup & Migrations

> Goal: PostgreSQL running locally, all tables created via Alembic migrations.

### Step 2.1 — BACKEND: Set Up PostgreSQL Locally

1. Install PostgreSQL locally (or use Docker: `docker run --name workforge-pg -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres:15`).
2. Create the database: `CREATE DATABASE workforge;`
3. Update `backend/.env` `DATABASE_URL` with correct credentials.

---

### Step 2.2 — BACKEND: Set Up SQLAlchemy Base & Session

1. Create `backend/app/db/base.py`:
   - Define `Base = declarative_base()`.
   - Create async engine using `DATABASE_URL` from settings.
   - Create `AsyncSessionLocal` using `async_sessionmaker`.
2. Create `backend/app/db/session.py`:
   - Define `get_db()` as an async generator dependency (yields `AsyncSession`).

---

### Step 2.3 — BACKEND: Create All SQLAlchemy Models

Create one file per model in `backend/app/models/`:

1. **`user.py`** — `User` model with columns: id, email, name, password_hash, bio, avatar_url, target_role, created_at, updated_at.
2. **`skill.py`** — `SkillCatalog` model with columns: id, name, category, description.
3. **`user_skill.py`** — `UserSkill` model with columns: id, user_id (FK), skill_id (FK), proficiency, created_at, updated_at. Unique constraint on (user_id, skill_id).
4. **`event.py`** — `Event` model with columns: id, name, description, event_type, start_date, end_date, location, organizer, skills (ARRAY), url, created_at.
5. **`event_interest.py`** — `EventInterest` model with columns: id, user_id (FK), event_id (FK), status, created_at, updated_at. Unique constraint on (user_id, event_id).
6. **`ml_analysis.py`** — `MLAnalysis` model with columns: id, user_id (FK), target_role, gaps (JSON), ran_at.

Create `backend/app/models/__init__.py` that imports all models (needed by Alembic).

---

### Step 2.4 — BACKEND: Set Up Alembic & Run Initial Migration

1. Initialize Alembic: `alembic init alembic` (run inside `backend/`).
2. Update `alembic/env.py`:
   - Import `Base` from `app.db.base`.
   - Set `target_metadata = Base.metadata`.
   - Configure async support for Alembic with asyncpg.
3. Update `alembic.ini`: set `sqlalchemy.url` to read from `DATABASE_URL` env var.
4. Generate initial migration: `alembic revision --autogenerate -m "initial schema"`.
5. Review the generated migration file in `alembic/versions/` — ensure all tables and constraints look correct.
6. Apply migration: `alembic upgrade head`.
7. Verify in `psql` or pgAdmin that all tables exist.

---

### Step 2.5 — BACKEND: Seed Skill Catalog

1. Create `backend/data/skill_catalog.json` with at minimum 80 skills covering: Programming Languages, Frontend Frameworks, Backend Frameworks, Databases, DevOps, Cloud, Data Science, Mobile, Testing, Design.
   - Format: `[{ "name": "Python", "category": "Programming Language", "description": "..." }, ...]`
2. Create a seed script `backend/app/db/seed.py`:
   - Reads `skill_catalog.json`.
   - Inserts all skills into `skill_catalog` table (skip if already exists — use `ON CONFLICT DO NOTHING`).
3. Run seed: `python -m app.db.seed`.
4. Verify skills appear in the DB.

---

### Step 2.6 — BACKEND: Seed Role Requirements Data

1. Create `backend/data/role_requirements.json` covering at minimum 15 roles:
   - Frontend Developer, Backend Developer, Full Stack Developer, Data Scientist, ML Engineer, DevOps Engineer, Cloud Architect, Mobile Developer, QA Engineer, Data Analyst, Cybersecurity Engineer, Product Manager (tech), UI/UX Designer (tech tools), Site Reliability Engineer, Data Engineer.
   - Format: `{ "Frontend Developer": { "React": 4, "JavaScript": 5, "HTML": 5, "CSS": 4, "TypeScript": 3, "Git": 3 }, ... }`
2. This file is used by the ML pipeline — no DB insertion needed; it's loaded at runtime.

---

### Step 2.7 — BACKEND: Seed Sample Events

1. Create `backend/data/events_seed.json` with 20–30 realistic tech events.
   - Include variety: conferences, hackathons, workshops, meetups.
   - Spread dates 30 days into the past and 90 days into the future from creation date.
2. Add events seeding to `app/db/seed.py`.
3. Re-run seed to populate events.

Commit: `git commit -m "feat: database schema, migrations, and seed data"`.

---

## Phase 3 — Authentication

> Goal: Users can register, login, and receive JWT tokens. Protected routes reject unauthorized requests.

### Step 3.1 — BACKEND: Security Utilities

1. Create `backend/app/core/security.py`:
   - `hash_password(plain: str) -> str` — uses passlib bcrypt.
   - `verify_password(plain: str, hashed: str) -> bool`.
   - `create_access_token(data: dict) -> str` — creates JWT with `exp` using `JWT_SECRET` and `JWT_EXPIRY_DAYS`.
   - `decode_access_token(token: str) -> dict` — decodes JWT, raises `HTTPException(401)` if invalid/expired.

---

### Step 3.2 — BACKEND: Auth Schemas (Pydantic)

Create `backend/app/schemas/auth.py`:
- `RegisterRequest` — `name: str`, `email: EmailStr`, `password: str (min_length=8)`.
- `LoginRequest` — `email: EmailStr`, `password: str`.
- `UserOut` — `id`, `email`, `name`, `avatar_url`, `target_role`, `created_at` (no password_hash).
- `TokenResponse` — `{ token: str, user: UserOut }`.

---

### Step 3.3 — BACKEND: Auth Service

Create `backend/app/services/auth_service.py`:
- `register_user(db, data: RegisterRequest) -> TokenResponse`:
  - Check email uniqueness → 409 if taken.
  - Hash password → insert user → generate token → return `TokenResponse`.
- `login_user(db, data: LoginRequest) -> TokenResponse`:
  - Find user by email → 401 if not found.
  - Verify password → 401 if wrong.
  - Generate token → return `TokenResponse`.

---

### Step 3.4 — BACKEND: Auth Router

Create `backend/app/routers/auth.py`:
- `POST /auth/register` → calls `auth_service.register_user`.
- `POST /auth/login` → calls `auth_service.login_user`.
- `GET /auth/me` → protected by `get_current_user` dependency → returns current user as `UserOut`.

Register the router in `app/main.py` with prefix `/api/v1`.

---

### Step 3.5 — BACKEND: `get_current_user` Dependency

Create `backend/app/core/dependencies.py`:
- `get_current_user(token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)) -> User`.
- Decodes token, fetches user from DB, raises 401 if invalid.

---

### Step 3.6 — BACKEND: Test Auth Endpoints

Using FastAPI's Swagger UI at `http://localhost:8000/docs`:
1. `POST /api/v1/auth/register` with valid data → expect `{ token, user }`.
2. `POST /api/v1/auth/register` with the same email again → expect 409.
3. `POST /api/v1/auth/login` with correct credentials → expect `{ token, user }`.
4. `POST /api/v1/auth/login` with wrong password → expect 401.
5. `GET /api/v1/auth/me` with Bearer token → expect user object.
6. `GET /api/v1/auth/me` without token → expect 401.

---

### Step 3.7 — FRONTEND: AuthContext

Create `src/context/AuthContext.jsx`:
- State: `{ user, token, isLoading }`.
- On mount: read token from `localStorage`, call `GET /auth/me` to verify.
- `login(token, user)` → save to state + `localStorage`.
- `logout()` → clear state + `localStorage` + navigate to `/login`.
- Export `AuthContext` and `AuthProvider` component + `useAuth` hook.

---

### Step 3.8 — FRONTEND: Axios Client & Auth API

1. Create `src/api/axiosClient.js`:
   - `baseURL` = `import.meta.env.VITE_API_URL`.
   - Request interceptor: inject `Authorization: Bearer <token>` from localStorage.
   - Response interceptor: on 401, call `logout()` and redirect to `/login`.
2. Create `src/api/authApi.js`:
   - `register(data)` → `POST /api/v1/auth/register`.
   - `login(data)` → `POST /api/v1/auth/login`.
   - `getMe()` → `GET /api/v1/auth/me`.

---

### Step 3.9 — FRONTEND: ProtectedRoute & GuestRoute

Create `src/components/auth/ProtectedRoute.jsx`:
- Reads `{ user, isLoading }` from AuthContext.
- If `isLoading`: render `<Spinner />` (full-screen centered).
- If no `user`: `<Navigate to="/login" replace />`.
- Otherwise: render `<Outlet />`.

Create `src/components/auth/GuestRoute.jsx`:
- If `user` exists: `<Navigate to="/dashboard" replace />`.
- Otherwise: render `<Outlet />`.

---

### Step 3.10 — FRONTEND: App Router Setup

Set up all routes in `src/App.jsx`:
```jsx
<BrowserRouter>
  <Routes>
    {/* Guest routes */}
    <Route element={<GuestRoute />}>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
    </Route>

    {/* Protected routes (wrapped in layout) */}
    <Route element={<ProtectedRoute />}>
      <Route element={<AppLayout />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/skills" element={<SkillsPage />} />
        <Route path="/ai-insights" element={<AIInsightsPage />} />
        <Route path="/events" element={<EventsPage />} />
        <Route path="/events/:id" element={<EventDetailPage />} />
      </Route>
    </Route>

    {/* Redirects */}
    <Route path="/" element={<Navigate to="/dashboard" replace />} />
    <Route path="*" element={<NotFoundPage />} />
  </Routes>
</BrowserRouter>
```

Create placeholder stub components for all page files (just `export default function XPage() { return <div>XPage</div> }`) so routing compiles without errors.

---

### Step 3.11 — FRONTEND: Build UI Design System (Base Components)

Build all UI primitives in `src/components/ui/`. These are used by every feature, so build them now:

**`Button.jsx`** — props: `variant` (primary/secondary/ghost/danger), `size` (sm/md/lg), `isLoading`, `disabled`, `onClick`, `type`, `children`.

**`Input.jsx`** — props: `label`, `error`, `id`, `...register` spread-compatible.

**`Card.jsx`** — props: `children`, `className`, optional `title` header slot.

**`Badge.jsx`** — props: `label`, `variant` (success/warning/danger/info/neutral).

**`Modal.jsx`** — props: `isOpen`, `onClose`, `title`, `children`. Renders via React portal.

**`Spinner.jsx`** — centered circular spinner, two sizes.

**`Skeleton.jsx`** — shimmer block, props: `width`, `height`, `className`.

**`Toast.jsx`** + `ToastProvider.jsx` + `useToast.js` — notification system. Toasts are stacked in the top-right corner.

---

### Step 3.12 — FRONTEND: Build Layout Components

1. **`Navbar.jsx`** — logo, nav links, user avatar dropdown (Profile + Logout).
2. **`Sidebar.jsx`** — side nav with icons + labels. Collapsible on desktop. Hamburger on mobile.
3. **`PageWrapper.jsx`** — wraps page content with padding and max-width.
4. **`AppLayout.jsx`** — combines Sidebar + Navbar + `<Outlet />` + `<ToastProvider />`.

---

### Step 3.13 — FRONTEND: Build Login & Register Pages

**`LoginPage.jsx`**:
- Two fields: Email, Password.
- React Hook Form + Zod validation.
- On submit: call `authApi.login()`, on success: `login(token, user)` → navigate to `/dashboard`.
- Error toast on failure.
- Link to `/register`.
- Premium design: centered card on dark background with gradient text title.

**`RegisterPage.jsx`**:
- Four fields: Full Name, Email, Password, Confirm Password.
- Zod: passwords match, min 8 chars.
- On submit: call `authApi.register()`, on success: `login(token, user)` → navigate to `/dashboard`.
- Error toast on failure.
- Link to `/login`.

---

### Step 3.14 — Verify Phase 3 End-to-End

1. Start backend (`uvicorn app.main:app --reload`).
2. Start frontend (`npm run dev`).
3. Open `http://localhost:5173`.
4. Should redirect to `/login`.
5. Register a new user → should reach `/dashboard` stub.
6. Refresh the page → should stay on `/dashboard` (token persisted in localStorage).
7. Click Logout → should land on `/login`.
8. Login with credentials → should reach `/dashboard`.
9. Try to navigate to `/login` while logged in → should redirect to `/dashboard`.

Commit: `git commit -m "feat: authentication — register, login, JWT, frontend auth flow"`.

---

## Phase 4 — User Profile

> Goal: Users can view and edit their profile (name, bio, avatar, target role).

### Step 4.1 — BACKEND: Profile Schemas

Add to `backend/app/schemas/user.py`:
- `ProfileResponse` — all profile fields (no password).
- `ProfileUpdateRequest` — optional fields: `name`, `bio`, `avatar_url`, `target_role`.

---

### Step 4.2 — BACKEND: User Service

Create `backend/app/services/user_service.py`:
- `get_profile(db, user_id) -> ProfileResponse`.
- `update_profile(db, user_id, data: ProfileUpdateRequest) -> ProfileResponse`.
  - Only update fields that are provided (partial update).
  - Update `updated_at`.

---

### Step 4.3 — BACKEND: Users Router

Create `backend/app/routers/users.py`:
- `GET /users/profile` → protected → returns `ProfileResponse`.
- `PATCH /users/profile` → protected → accepts `ProfileUpdateRequest` → returns updated `ProfileResponse`.

Register in `main.py` with prefix `/api/v1`.

---

### Step 4.4 — BACKEND: Test Profile Endpoints

In Swagger UI:
1. `GET /api/v1/users/profile` with Bearer token → expect profile.
2. `PATCH /api/v1/users/profile` with `{ "bio": "I am a developer" }` → expect updated profile.
3. `PATCH /api/v1/users/profile` with `{ "target_role": "Frontend Developer" }` → expect update.

---

### Step 4.5 — FRONTEND: Profile API

Create `src/api/profileApi.js`:
- `getProfile()` → `GET /api/v1/users/profile`.
- `updateProfile(data)` → `PATCH /api/v1/users/profile`.

---

### Step 4.6 — FRONTEND: Build Profile Page

`src/pages/profile/ProfilePage.jsx`:
- Use `useQuery(['profile'], getProfile)` to load profile.
- Pre-fill form with loaded values.
- React Hook Form + Zod: name required, bio optional, avatar_url URL format (optional), target_role optional.
- On submit: `useMutation(updateProfile)` → on success: invalidate `['profile']` query + show toast.
- Show skeleton while loading.

Commit: `git commit -m "feat: user profile — view and edit"`.

---

## Phase 5 — Skills Management

> Goal: Users can browse the skill catalog and manage their personal skill inventory (add, update proficiency, delete).

### Step 5.1 — BACKEND: Skill Schemas

Create `backend/app/schemas/skill.py`:
- `SkillCatalogItem` — `{ id, name, category }`.
- `UserSkillResponse` — `{ id, skill_id, name, category, proficiency, created_at }`.
- `AddSkillRequest` — `{ name: str, proficiency: int (1-5) }`.
- `UpdateSkillRequest` — `{ proficiency: int (1-5) }`.

---

### Step 5.2 — BACKEND: Skill Service

Create `backend/app/services/skill_service.py`:
- `get_skill_catalog(db) -> list[SkillCatalogItem]` — returns all catalog skills.
- `get_user_skills(db, user_id) -> list[UserSkillResponse]` — returns user's inventory.
- `add_skill(db, user_id, data: AddSkillRequest) -> UserSkillResponse`:
  - Find skill in catalog by name (case-insensitive).
  - If not in catalog, create it (category = "Other").
  - Check if user already has it → 409 if yes.
  - Insert `UserSkill` row.
- `update_skill(db, user_id, skill_id, data: UpdateSkillRequest) -> UserSkillResponse`:
  - Find `UserSkill` by ID, verify it belongs to `user_id` → 403 if not.
  - Update proficiency.
- `delete_skill(db, user_id, skill_id)`:
  - Find `UserSkill`, verify ownership → 403 if not.
  - Delete.

---

### Step 5.3 — BACKEND: Skills Router

Create `backend/app/routers/skills.py`:
- `GET /skills/catalog` → protected → returns catalog list.
- `GET /skills` → protected → returns user's skill inventory.
- `POST /skills` → protected → add skill.
- `PATCH /skills/{skill_id}` → protected → update proficiency.
- `DELETE /skills/{skill_id}` → protected → delete skill. Returns 204.

Register in `main.py` with prefix `/api/v1`.

---

### Step 5.4 — BACKEND: Test Skills Endpoints

In Swagger UI (all requests require Bearer token):
1. `GET /api/v1/skills/catalog` → expect list of 80+ skills.
2. `POST /api/v1/skills` with `{ "name": "Python", "proficiency": 4 }` → expect skill added.
3. `POST /api/v1/skills` with same skill again → expect 409.
4. `GET /api/v1/skills` → expect `[{ id, name, "Python", proficiency: 4, ... }]`.
5. `PATCH /api/v1/skills/{id}` with `{ "proficiency": 5 }` → expect updated.
6. `DELETE /api/v1/skills/{id}` → expect 204.
7. `GET /api/v1/skills` → expect empty list.

---

### Step 5.5 — FRONTEND: Skills API

Create `src/api/skillsApi.js`:
- `getUserSkills()` → `GET /api/v1/skills`.
- `addSkill(data)` → `POST /api/v1/skills`.
- `updateSkill(skillId, data)` → `PATCH /api/v1/skills/${skillId}`.
- `deleteSkill(skillId)` → `DELETE /api/v1/skills/${skillId}`.
- `getSkillCatalog()` → `GET /api/v1/skills/catalog`.

---

### Step 5.6 — FRONTEND: Skill UI Components

Build in `src/components/skills/`:

**`SkillCard.jsx`** — displays one skill: name badge, category label, proficiency stars (1–5), edit icon button, delete icon button. On edit: shows inline proficiency selector.

**`SkillProficiencySlider.jsx`** — a 1–5 selector (can be a segmented control or star rating). Shows label for each level (1=Beginner, 2=Basic, 3=Intermediate, 4=Advanced, 5=Expert).

**`SkillInventoryList.jsx`** — renders list of `SkillCard` components. Handles empty state (illustration + CTA text).

**`AddSkillForm.jsx`** — text input with debounced catalog search (useDebounce 300ms), results dropdown, proficiency selector, Add button.

---

### Step 5.7 — FRONTEND: Build Skills Page

`src/pages/skills/SkillsPage.jsx`:
- Load skills: `useQuery(['skills'], getUserSkills)`.
- Load catalog for autocomplete: `useQuery(['skills', 'catalog'], getSkillCatalog)`.
- Search bar to filter inventory by name (client-side filter).
- Sort by proficiency descending.
- `AddSkillForm` at top of page.
  - Add mutation: `useMutation(addSkill)` → on success: `invalidateQueries(['skills'])` + success toast.
- Each `SkillCard`:
  - Edit proficiency: `useMutation(updateSkill)` → on success: `invalidateQueries(['skills'])`.
  - Delete: confirmation dialog → `useMutation(deleteSkill)` → on success: `invalidateQueries(['skills'])`.
- Skeleton loading state while fetching.

Commit: `git commit -m "feat: skills inventory — CRUD with catalog autocomplete"`.

---

## Phase 6 — Events

> Goal: Users can browse, filter, and track their interest in tech events.

### Step 6.1 — BACKEND: Event Schemas

Create `backend/app/schemas/event.py`:
- `EventListItem` — `{ id, name, event_type, start_date, end_date, location, skills, user_interest_status }`.
- `EventDetail` — all fields including description, organizer, url.
- `EventsResponse` — `{ items: list[EventListItem], total, page, per_page, pages }`.
- `EventInterestRequest` — `{ status: Literal["interested", "registered", "attended"] }`.

---

### Step 6.2 — BACKEND: Event Service

Create `backend/app/services/event_service.py`:
- `get_events(db, user_id, filters, page, per_page) -> EventsResponse`:
  - Filter by: `type` (list), `date_from`, `date_to`, `location` (partial match), `skill` (array contains).
  - For each event, join `event_interests` to get current user's status (null if none).
  - Paginate.
- `get_event_by_id(db, event_id, user_id) -> EventDetail` — 404 if not found.
- `set_interest(db, user_id, event_id, status) -> EventInterest`:
  - Upsert: if exists update status, if not insert.
- `remove_interest(db, user_id, event_id)`:
  - Delete record. 404 if doesn't exist.

---

### Step 6.3 — BACKEND: Events Router

Create `backend/app/routers/events.py`:
- `GET /events` → query params: `type` (multi), `date_from`, `date_to`, `location`, `skill`, `page`, `per_page`.
- `GET /events/{event_id}`.
- `POST /events/{event_id}/interest` → body: `{ status }`.
- `DELETE /events/{event_id}/interest`.

Register in `main.py` with prefix `/api/v1`.

---

### Step 6.4 — BACKEND: Test Events Endpoints

1. `GET /api/v1/events` → expect paginated list of seeded events with `user_interest_status: null`.
2. `GET /api/v1/events?type=hackathon` → expect filtered results.
3. `GET /api/v1/events?date_from=2026-08-01` → expect filtered by date.
4. `POST /api/v1/events/{id}/interest` with `{ "status": "interested" }` → expect 200.
5. `GET /api/v1/events` → same event should now have `user_interest_status: "interested"`.
6. `DELETE /api/v1/events/{id}/interest` → expect 204.

---

### Step 6.5 — FRONTEND: Events API

Create `src/api/eventsApi.js`:
- `getEvents(params)` → `GET /api/v1/events` (pass filter params as query string).
- `getEventById(id)` → `GET /api/v1/events/${id}`.
- `setInterest(eventId, status)` → `POST /api/v1/events/${eventId}/interest`.
- `removeInterest(eventId)` → `DELETE /api/v1/events/${eventId}/interest`.

---

### Step 6.6 — FRONTEND: Events UI Components

Build in `src/components/events/`:

**`EventCard.jsx`** — shows: event name, type badge, date, location, skill tags (up to 3 shown + overflow count), current interest status button. Interest button cycles through states (None → Interested → Registered → Attended → None).

**`EventFilter.jsx`** — filter panel: type checkboxes, date range inputs (from/to), location text input, skill text input, Apply Filters + Reset buttons.

**`EventStatusBadge.jsx`** — colored badge for event type (Conference = blue, Hackathon = orange, Workshop = purple, Meetup = green).

---

### Step 6.7 — FRONTEND: Build Events Pages

**`EventsPage.jsx`**:
- `EventFilter` bar at top.
- Store filter state in component state (or URL search params for shareability).
- `useQuery(['events', filters, page], () => getEvents({...filters, page}), { keepPreviousData: true })`.
- Responsive grid of `EventCard`.
- Pagination controls.
- Interest mutations: `useMutation(setInterest)` and `useMutation(removeInterest)` → invalidate events query on success.
- Empty state when no events match.

**`EventDetailPage.jsx`** (route: `/events/:id`):
- `useQuery(['events', id], () => getEventById(id))`.
- Full event details layout.
- Interest status buttons.
- Back button to EventsPage.

Commit: `git commit -m "feat: events — browse, filter, interest tracking"`.

---

## Phase 7 — ML: Gap Analysis

> Goal: Users can input a target role and get a real ML-powered gap analysis of their skills.

### Step 7.1 — BACKEND: Prepare ML Data & Role Requirements

1. Finalize `backend/data/role_requirements.json` with all 15+ roles (done in Phase 2.6).
2. Create `backend/app/ml/data_loader.py`:
   - `load_role_requirements() -> dict` — reads and caches `role_requirements.json`.
   - `get_available_roles() -> list[str]` — returns list of role names.

---

### Step 7.2 — BACKEND: Build Gap Analyzer

Create `backend/app/ml/gap_analyzer.py`:

```python
class GapAnalyzer:
    def __init__(self):
        self.role_requirements = load_role_requirements()

    def analyze(self, user_skills: dict[str, int], target_role: str) -> list[dict]:
        """
        user_skills: { "Python": 4, "React": 2, ... }
        Returns: sorted list of gap dicts
        """
        requirements = self.role_requirements.get(target_role, {})
        gaps = []
        for skill, required_level in requirements.items():
            current_level = user_skills.get(skill, 0)
            gap_magnitude = max(0, required_level - current_level)
            if gap_magnitude > 0:
                severity = (
                    "High" if gap_magnitude >= 3 else
                    "Medium" if gap_magnitude == 2 else
                    "Low"
                )
                gaps.append({
                    "skill": skill,
                    "current": current_level,
                    "required": required_level,
                    "gap_magnitude": gap_magnitude,
                    "severity": severity,
                })
        # Sort: High severity first, then by gap magnitude descending
        gaps.sort(key=lambda x: (
            {"High": 0, "Medium": 1, "Low": 2}[x["severity"]],
            -x["gap_magnitude"]
        ))
        return gaps

gap_analyzer = GapAnalyzer()   # singleton instance
```

---

### Step 7.3 — BACKEND: ML Schemas

Create `backend/app/schemas/ml.py`:
- `GapAnalysisRequest` — `{ target_role: str }`.
- `GapItem` — `{ skill, current, required, gap_magnitude, severity }`.
- `GapAnalysisResponse` — `{ target_role, gaps: list[GapItem], ran_at }`.
- `RecommendationItem` — `{ skill, priority, reason }`.
- `RecommendationsResponse` — `{ recommendations: list[RecommendationItem] }`.
- `ResourceItem` — `{ title, type, platform, url, duration }`.
- `ResourcesResponse` — `{ skill, resources: list[ResourceItem] }`.

---

### Step 7.4 — BACKEND: ML Service (Gap Analysis Part)

Create `backend/app/services/ml_service.py` (gap analysis section):
- `run_gap_analysis(db, user_id, target_role) -> GapAnalysisResponse`:
  1. Validate `target_role` is in `role_requirements` → 400 if unknown.
  2. Fetch user's skills from `user_skills` table → build `{ skill_name: proficiency }` dict.
  3. Call `gap_analyzer.analyze(user_skills_dict, target_role)`.
  4. Store result in `ml_analyses` table.
  5. Return `GapAnalysisResponse`.

---

### Step 7.5 — BACKEND: ML Router (Gap Analysis)

Create `backend/app/routers/ml.py`:
- `POST /ml/gap-analysis` → protected → calls `ml_service.run_gap_analysis` → returns `GapAnalysisResponse`.
- `GET /ml/roles` → protected → returns list of available target roles (for frontend dropdown).

Register in `main.py` with prefix `/api/v1`.

---

### Step 7.6 — BACKEND: Test Gap Analysis

1. Add 5+ skills to your test user's inventory via `POST /api/v1/skills`.
2. `POST /api/v1/ml/gap-analysis` with `{ "target_role": "Frontend Developer" }`.
3. Verify response includes only skills where user is below required level.
4. Verify severity classification is correct.
5. Verify result saved to `ml_analyses` table in DB.

---

### Step 7.7 — FRONTEND: ML API (Gap Analysis)

Create `src/api/mlApi.js`:
- `runGapAnalysis(target_role)` → `POST /api/v1/ml/gap-analysis`.
- `getAvailableRoles()` → `GET /api/v1/ml/roles`.

---

### Step 7.8 — FRONTEND: Gap Analysis UI Components

Create `src/components/ml/GapAnalysisChart.jsx`:
- Takes `gaps: GapItem[]` as prop.
- Renders Recharts `BarChart` (horizontal).
- Two bars per skill: current (blue) vs required (indigo dashed/lighter).
- Legend: "Current Level" vs "Required Level".
- X-axis: 0–5 (proficiency levels).
- Y-axis: skill names.
- Color-coded severity on each bar (red/yellow/green background tint).

---

### Step 7.9 — FRONTEND: Build AI Insights Page — Gap Analysis Section

`src/pages/ml/AIInsightsPage.jsx` (Section A only for now):
- Target role selector: dropdown populated from `GET /ml/roles`.
- Pre-fill from user's profile `target_role` if set.
- "Run Analysis" button → `useMutation(runGapAnalysis)`.
- Loading state: skeleton + animated text.
- On success: render `GapAnalysisChart` + gap list below chart.
- Each gap item: skill name, current level label, required level label, severity badge.
- CTA button at bottom: "Get Skill Recommendations" (scrolls down to Section B — stub for now).
- Error toast if API fails.

Commit: `git commit -m "feat: ML gap analysis — backend algorithm + frontend visualization"`.

---

## Phase 8 — ML: Skill Recommender

> Goal: After gap analysis, users get a prioritized list of skills to learn next.

### Step 8.1 — BACKEND: Build Recommender

Create `backend/app/ml/recommender.py`:

```python
class SkillRecommender:
    def __init__(self):
        self.role_requirements = load_role_requirements()

    def recommend(
        self,
        user_skills: dict[str, int],
        gaps: list[dict],
        top_n: int = 8
    ) -> list[dict]:
        """
        Ranks gap skills by a weighted score:
          - Gap magnitude (weight 0.5)
          - Frequency across all roles (weight 0.3) — how "universal" the skill is
          - Synergy with existing skills (weight 0.2) — how many roles use this + a skill user already has
        """
        # Build skill frequency map across all roles
        skill_freq = {}
        for role_skills in self.role_requirements.values():
            for skill in role_skills:
                skill_freq[skill] = skill_freq.get(skill, 0) + 1
        max_freq = max(skill_freq.values()) if skill_freq else 1

        # Build synergy map (co-occurrence with user's skills)
        user_skill_names = set(user_skills.keys())
        skill_synergy = {}
        for role_skills in self.role_requirements.values():
            role_skill_names = set(role_skills.keys())
            overlap = len(role_skill_names & user_skill_names)
            if overlap > 0:
                for skill in role_skill_names:
                    skill_synergy[skill] = skill_synergy.get(skill, 0) + overlap

        results = []
        for gap in gaps:
            skill = gap["skill"]
            gap_score = gap["gap_magnitude"] / 4.0          # normalize 0–1
            freq_score = skill_freq.get(skill, 0) / max_freq
            synergy_score = min(skill_synergy.get(skill, 0) / 10.0, 1.0)

            final_score = (
                0.5 * gap_score +
                0.3 * freq_score +
                0.2 * synergy_score
            )

            reason = self._generate_reason(skill, gap, skill_freq.get(skill, 0))
            results.append({
                "skill": skill,
                "score": round(final_score, 4),
                "reason": reason,
            })

        results.sort(key=lambda x: -x["score"])
        for i, r in enumerate(results[:top_n]):
            r["priority"] = i + 1

        return results[:top_n]

    def _generate_reason(self, skill, gap, freq):
        severity_text = {
            "High": "a critical gap",
            "Medium": "a notable gap",
            "Low": "a small gap"
        }[gap["severity"]]
        return (
            f"{skill} is {severity_text} for your target role "
            f"(you need level {gap['required']}, currently at {gap['current']}). "
            f"It's required in {freq} roles — high career value."
        )

recommender = SkillRecommender()
```

---

### Step 8.2 — BACKEND: ML Service (Recommendations Part)

Add to `ml_service.py`:
- `get_recommendations(db, user_id) -> RecommendationsResponse`:
  1. Fetch most recent `ml_analyses` for user → 400 if none ("Run gap analysis first").
  2. Fetch user's current skills.
  3. Call `recommender.recommend(user_skills, latest_gaps)`.
  4. Return `RecommendationsResponse`.

---

### Step 8.3 — BACKEND: ML Router (Recommendations)

Add to `backend/app/routers/ml.py`:
- `GET /ml/recommendations` → protected → calls `ml_service.get_recommendations`.

---

### Step 8.4 — BACKEND: Test Recommendations

1. Ensure gap analysis was run first.
2. `GET /api/v1/ml/recommendations` → expect ranked list with reasons.
3. Verify priority order makes sense (higher gap magnitude + more universal skills rank higher).

---

### Step 8.5 — FRONTEND: Recommendations API

Add to `src/api/mlApi.js`:
- `getRecommendations()` → `GET /api/v1/ml/recommendations`.

---

### Step 8.6 — FRONTEND: RecommendedSkillCard Component

Create `src/components/ml/RecommendedSkillCard.jsx`:
- Shows: priority rank number (styled as a badge), skill name, reasoning text, "View Resources →" button.
- Priority 1–3 get a highlighted "star" accent style.

---

### Step 8.7 — FRONTEND: AI Insights Page — Recommendations Section

Add Section B to `AIInsightsPage.jsx`:
- Fetched with `useQuery(['ml', 'recommendations'], getRecommendations)`.
- Shown after gap analysis results (or triggered manually with a button if no analysis yet).
- Renders ranked list of `RecommendedSkillCard`.
- "View Resources" on each card → sets a `selectedSkill` state → triggers Section C to appear/scroll into view.

Commit: `git commit -m "feat: ML skill recommender — weighted scoring + frontend ranking UI"`.

---

## Phase 9 — ML: Resource Suggester

> Goal: For any recommended skill, users get curated learning resources.

### Step 9.1 — BACKEND: Curate Resources Data

Create `backend/data/skill_resources.json`:
- For at minimum 40 key skills (the most common ones from `role_requirements.json`).
- Each skill entry has 5–8 resources.
- Format:
  ```json
  {
    "Python": [
      { "title": "Python for Everybody", "type": "course", "platform": "Coursera", "url": "...", "duration": "3 months" },
      { "title": "Official Python Docs", "type": "documentation", "platform": "python.org", "url": "...", "duration": null },
      { "title": "Automate the Boring Stuff", "type": "book", "platform": "automatetheboringstuff.com", "url": "...", "duration": "self-paced" }
    ],
    "React": [ ... ],
    ...
  }
  ```

---

### Step 9.2 — BACKEND: Build Resource Suggester

Create `backend/app/ml/resource_suggester.py`:

```python
import json
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

class ResourceSuggester:
    def __init__(self):
        with open("data/skill_resources.json") as f:
            self.resources_db = json.load(f)
        self.skill_names = list(self.resources_db.keys())
        # Build TF-IDF index for skill name matching (handles partial/fuzzy matches)
        self.vectorizer = TfidfVectorizer(analyzer="char_wb", ngram_range=(2, 4))
        self.skill_matrix = self.vectorizer.fit_transform(self.skill_names)

    def suggest(self, skill_name: str, top_n: int = 6) -> list[dict]:
        skill_name_clean = skill_name.strip().lower()

        # Exact match first
        for name, resources in self.resources_db.items():
            if name.lower() == skill_name_clean:
                return self._score_and_sort(resources, top_n)

        # Fuzzy match via TF-IDF similarity
        query_vec = self.vectorizer.transform([skill_name_clean])
        similarities = cosine_similarity(query_vec, self.skill_matrix)[0]
        best_idx = int(np.argmax(similarities))

        if similarities[best_idx] > 0.3:
            best_skill = self.skill_names[best_idx]
            return self._score_and_sort(self.resources_db[best_skill], top_n)

        return []  # No match found

    def _score_and_sort(self, resources: list, top_n: int) -> list:
        # Type priority: course > video > article > documentation > book
        type_rank = {"course": 1, "video": 2, "article": 3, "documentation": 4, "book": 5, "tutorial": 2}
        scored = [
            {**r, "_rank": type_rank.get(r.get("type", "article"), 6)}
            for r in resources
        ]
        scored.sort(key=lambda x: x["_rank"])
        return [{k: v for k, v in r.items() if k != "_rank"} for r in scored[:top_n]]

resource_suggester = ResourceSuggester()
```

---

### Step 9.3 — BACKEND: ML Service (Resources Part)

Add to `ml_service.py`:
- `get_resources(skill_name: str) -> ResourcesResponse`:
  - Call `resource_suggester.suggest(skill_name)`.
  - Return `ResourcesResponse`.

---

### Step 9.4 — BACKEND: ML Router (Resources)

Add to `backend/app/routers/ml.py`:
- `GET /ml/resources/{skill_name}` → protected → calls `ml_service.get_resources`.

---

### Step 9.5 — BACKEND: Test Resources

1. `GET /api/v1/ml/resources/Python` → expect list of resources.
2. `GET /api/v1/ml/resources/python` → same result (case insensitive).
3. `GET /api/v1/ml/resources/Pyhton` (typo) → expect closest match resources (TF-IDF fuzzy match).
4. `GET /api/v1/ml/resources/XYZNonsenseSkill` → expect empty list.

---

### Step 9.6 — FRONTEND: Resources API

Add to `src/api/mlApi.js`:
- `getResources(skillName)` → `GET /api/v1/ml/resources/${encodeURIComponent(skillName)}`.

---

### Step 9.7 — FRONTEND: ResourceCard Component

Create `src/components/ml/ResourceCard.jsx`:
- Shows: resource title, type badge (Course / Video / Article / Documentation / Book), platform name, duration, external link button (opens in new tab).
- Type badge has distinct colors per type.

---

### Step 9.8 — FRONTEND: AI Insights Page — Resources Section

Add Section C to `AIInsightsPage.jsx`:
- Shown when `selectedSkill` state is set (by clicking "View Resources" on a `RecommendedSkillCard`).
- `useQuery(['ml', 'resources', selectedSkill], () => getResources(selectedSkill), { enabled: !!selectedSkill })`.
- Shows selected skill name as heading.
- Renders grid of `ResourceCard`.
- "← Back to Recommendations" link to clear selection.

Commit: `git commit -m "feat: ML resource suggester — TF-IDF matching + frontend resource cards"`.

---

## Phase 10 — Dashboard

> Goal: Dashboard shows a meaningful summary pulling from all completed features.

### Step 10.1 — BACKEND: Dashboard Data Endpoint

Add `GET /api/v1/users/dashboard` to `users.py` router:
- Returns a combined response:
  ```json
  {
    "user": { name, target_role },
    "skill_count": 12,
    "proficiency_distribution": { "1": 2, "2": 3, "3": 4, "4": 2, "5": 1 },
    "top_gaps": [ top 3 gap items from latest ml_analyses ],
    "upcoming_events": [ next 3 events user has interest status on ]
  }
  ```
- Fetches each piece from their respective services.
- If no gap analysis exists: `top_gaps: null`.
- If no event interests: `upcoming_events: []`.

---

### Step 10.2 — FRONTEND: Dashboard API

Add to `src/api/profileApi.js` (or a new `dashboardApi.js`):
- `getDashboard()` → `GET /api/v1/users/dashboard`.

---

### Step 10.3 — FRONTEND: Build Dashboard Page

`src/pages/dashboard/DashboardPage.jsx`:
- `useQuery(['dashboard'], getDashboard)`.
- **Welcome Banner**: "Welcome back, {name}" with today's date.
- **Skill Snapshot Card**: skill count + Recharts `PieChart` (donut) showing proficiency distribution.
- **Top Skill Gaps Card**: list of top 3 gaps with severity badges. If `top_gaps: null`, show CTA: "Run your first gap analysis →" link to `/ai-insights`.
- **Upcoming Events Card**: list of 3 events with date + type badge. Empty state: "No events tracked yet →" link to `/events`.
- **Quick Actions**: three icon buttons — "Add Skills" → `/skills`, "Run Gap Analysis" → `/ai-insights`, "Browse Events" → `/events`.
- Skeleton for entire dashboard while loading.

Commit: `git commit -m "feat: dashboard — skill snapshot, gap summary, upcoming events"`.

---

## Phase 11 — Polish, Error Handling & Loading States

> Goal: The app feels complete, professional, and resilient to errors and slow connections.

### Step 11.1 — BACKEND: Global Exception Handler

In `app/main.py`:
- Add a global exception handler that catches unhandled exceptions and returns `{ "detail": "An unexpected error occurred" }` with status 500.
- Log the full traceback server-side.

---

### Step 11.2 — BACKEND: Input Validation Coverage

- Review all Pydantic schemas. Ensure:
  - String fields have reasonable `max_length` constraints.
  - Email fields use `EmailStr`.
  - Proficiency is `int` with `ge=1, le=5`.
  - Status enum uses `Literal["interested", "registered", "attended"]`.
  - `target_role` validated against known roles list.

---

### Step 11.3 — FRONTEND: Error Boundaries

- Wrap the entire app (inside `main.jsx`) with a React Error Boundary component.
- On crash: shows a "Something went wrong" page with a "Reload" button.

---

### Step 11.4 — FRONTEND: Toast Error Handling for All Mutations

Go through every `useMutation` call in the app and add `onError` handlers:
- Show a toast with the error message from the API (`err.response?.data?.detail || 'Something went wrong'`).
- Ensure auth errors (401) are handled globally by Axios interceptor (already set up in Phase 3.8).

---

### Step 11.5 — FRONTEND: Empty States

Ensure every list view has a proper empty state:
- Skills page: illustration + "You haven't added any skills yet. Start by adding your first skill above."
- Events page: "No events found matching your filters." with a Reset button.
- Recommendations: "Run a gap analysis first to get recommendations."
- Resources: "No resources found for this skill."
- Dashboard gaps: CTA to run analysis.

---

### Step 11.6 — FRONTEND: Loading Skeletons Everywhere

Ensure every data-loading state has a skeleton (not just a spinner):
- Skills list → skeleton cards.
- Events grid → skeleton cards.
- AI Insights sections → skeleton lists.
- Dashboard cards → skeleton blocks.
- Profile form → skeleton fields.

---

### Step 11.7 — FRONTEND: Responsive Layout Audit

On every page, test at these widths:
- 375px (mobile) — everything stacks, sidebar hidden, hamburger menu works.
- 768px (tablet) — two-column layouts, sidebar collapses.
- 1280px (desktop) — full layout, sidebar visible.

Fix any layout overflows, text truncation, or button sizes that are too small for mobile.

---

### Step 11.8 — FRONTEND: 404 Page

Build `NotFoundPage.jsx`:
- "404 — Page Not Found" message.
- Brief description.
- "Go to Dashboard" button.

---

### Step 11.9 — FRONTEND: Page Titles

In `index.html`, set the base title. On each page, use `document.title = "WorkForge — {PageName}"` in a `useEffect` to set the browser tab title dynamically.

---

### Step 11.10 — Final Manual Test Run

Go through the entire user journey:
1. Register a new account.
2. Fill out profile (name, bio, target role).
3. Add 8+ skills with varying proficiency levels.
4. Run gap analysis for the target role.
5. View recommendations.
6. View resources for the top-recommended skill.
7. Browse events. Apply filters. Mark two events as interested.
8. Go to dashboard — verify all sections show real data.
9. Log out. Log back in. Verify state persists.
10. Test on mobile width.

Commit: `git commit -m "polish: error handling, loading states, responsive layout, 404 page"`.

---

## Phase 12 — Deployment

> Goal: Live production app running on Vercel (frontend) + Render (backend) with a real PostgreSQL database.

### Step 12.1 — BACKEND: Prepare for Production

1. In `app/main.py`, update CORS to only allow the specific Vercel URL (not `*`).
2. Ensure all `settings.*` are used — no hardcoded values anywhere.
3. Create `backend/Procfile`:
   ```
   web: uvicorn app.main:app --host 0.0.0.0 --port $PORT
   ```
4. Update build command to include migrations:
   ```
   pip install -r requirements.txt && alembic upgrade head
   ```

---

### Step 12.2 — BACKEND: Deploy to Render

1. Go to [render.com](https://render.com) → New → Web Service.
2. Connect the GitHub repo.
3. Settings:
   - **Root Directory**: `backend`
   - **Runtime**: Python 3
   - **Build Command**: `pip install -r requirements.txt && alembic upgrade head`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Add environment variables:
   - `DATABASE_URL` — from Render PostgreSQL instance (or Supabase).
   - `JWT_SECRET` — generate with `openssl rand -hex 32`.
   - `FRONTEND_URL` — your Vercel URL (set after frontend deploy; update this later).
   - `ENVIRONMENT` = `production`.
5. Create a **Render PostgreSQL** database instance (or use Supabase free tier).
6. Deploy. Monitor build logs.
7. After deploy, run seed: trigger seed via a one-time command or include it in the build script.
8. Test health: `https://<your-render-service>.onrender.com/health`.
9. Test Swagger docs: `https://<your-render-service>.onrender.com/docs`.

---

### Step 12.3 — FRONTEND: Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) → New Project → Import GitHub repo.
2. Settings:
   - **Root Directory**: `frontend`.
   - **Framework Preset**: Vite.
3. Add environment variable:
   - `VITE_API_URL` = `https://<your-render-service>.onrender.com`
4. Deploy.
5. Copy the Vercel production URL (e.g., `https://workforge.vercel.app`).

---

### Step 12.4 — Connect Both Services

1. Go back to Render → your backend service → Environment tab.
2. Update `FRONTEND_URL` = your Vercel URL.
3. Redeploy or restart the Render service.
4. Test the CORS flow: open the Vercel frontend, try to log in — API calls should succeed.

---

### Step 12.5 — Final Production Verification

1. Open the Vercel URL in an incognito browser window.
2. Register a new account.
3. Go through all features end-to-end (same checklist as Phase 11.10).
4. Verify API calls in the browser Network tab — all going to the Render URL, all returning 200s.
5. Verify no console errors.
6. Test on a mobile device (or device emulator in DevTools).

Commit: `git commit -m "chore: production deployment config"`.

---

## Implementation Checklist

### Phase 1 — Scaffolding
- [ ] GitHub repo created, folder structure set up
- [ ] Backend: FastAPI app running, `/health` works, Swagger UI loads
- [ ] Frontend: Vite + React app running, TailwindCSS configured, design tokens set
- [ ] All source folders created

### Phase 2 — Database
- [ ] All SQLAlchemy models created
- [ ] Alembic migrations configured and run
- [ ] Skill catalog seeded (80+ skills)
- [ ] Role requirements JSON ready (15+ roles)
- [ ] Events seeded (20–30 events)

### Phase 3 — Authentication
- [ ] Register endpoint works
- [ ] Login endpoint works
- [ ] `get_current_user` dependency protects routes
- [ ] AuthContext persists token across page reloads
- [ ] ProtectedRoute / GuestRoute working
- [ ] Login + Register pages built with proper UX
- [ ] All UI primitives built (Button, Input, Card, Badge, Modal, Spinner, Skeleton, Toast)
- [ ] App layout (Navbar, Sidebar, PageWrapper) built

### Phase 4 — Profile
- [ ] Profile GET + PATCH endpoints working
- [ ] ProfilePage built with form + save

### Phase 5 — Skills
- [ ] Skill catalog endpoint working
- [ ] CRUD endpoints working (add, update, delete)
- [ ] SkillsPage built with inventory + add form + edit/delete

### Phase 6 — Events
- [ ] Events list with filtering + pagination working
- [ ] Interest tracking (set/remove) working
- [ ] EventsPage + EventDetailPage built

### Phase 7 — Gap Analysis
- [x] `role_requirements.json` finalized
- [x] Gap analyzer algorithm implemented
- [x] Gap analysis endpoint works and stores result
- [x] GapAnalysisChart built (Recharts)
- [x] AIInsightsPage Section A built

### Phase 8 — Recommender
- [x] Recommender weighted scoring implemented
- [x] Recommendations endpoint works
- [x] AIInsightsPage Section B built

### Phase 9 — Resource Suggester
- [x] `skill_resources.json` curated for 40+ skills
- [x] TF-IDF fuzzy skill matching working
- [x] Resources endpoint works
- [x] AIInsightsPage Section C built

### Phase 10 — Dashboard
- [ ] Dashboard data endpoint works (aggregated)
- [ ] DashboardPage fully built with all sections

### Phase 11 — Polish
- [ ] Error boundaries and global error handling
- [ ] All mutations have `onError` toast handlers
- [ ] All pages have loading skeletons
- [ ] All lists have empty states
- [ ] Responsive layout works on mobile/tablet/desktop
- [ ] 404 page built
- [ ] Full manual QA pass completed

### Phase 12 — Deployment
- [ ] Backend deployed on Render, health check passing
- [ ] Database on Render PostgreSQL (or Supabase)
- [ ] Frontend deployed on Vercel, loads correctly
- [ ] CORS configured for production URLs
- [ ] Full end-to-end test on production

---

*Last updated: 2026-07-29*  
*This document is the single source of truth for implementation order. Never skip phases. Complete backend steps before relying on them in frontend steps within the same phase.*
