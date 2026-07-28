# WorkForge — Frontend Plan

**Stack:** React 19, Vite, TailwindCSS v4, React Router v7, TanStack Query v5, React Hook Form + Zod, Recharts  
**Deployment:** Vercel  
**API Communication:** Axios (REST calls to FastAPI backend on Render)

---

## Table of Contents
1. [Project Structure](#1-project-structure)
2. [Pages & Routes](#2-pages--routes)
3. [Component Architecture](#3-component-architecture)
4. [State Management](#4-state-management)
5. [API Layer](#5-api-layer)
6. [Authentication Flow](#6-authentication-flow)
7. [Feature Breakdown](#7-feature-breakdown)
8. [Styling System](#8-styling-system)
9. [Environment & Config](#9-environment--config)
10. [Deployment on Vercel](#10-deployment-on-vercel)

---

## 1. Project Structure

```
workforge/
└── frontend/
    ├── public/
    │   └── favicon.ico
    ├── src/
    │   ├── api/                   # All Axios API calls, grouped by feature
    │   │   ├── axiosClient.js     # Base Axios instance with interceptors
    │   │   ├── authApi.js
    │   │   ├── profileApi.js
    │   │   ├── skillsApi.js
    │   │   ├── mlApi.js           # Gap analysis, recommender, resource suggester
    │   │   └── eventsApi.js
    │   │
    │   ├── components/            # Reusable UI components
    │   │   ├── ui/                # Design system primitives
    │   │   │   ├── Button.jsx
    │   │   │   ├── Input.jsx
    │   │   │   ├── Card.jsx
    │   │   │   ├── Badge.jsx
    │   │   │   ├── Modal.jsx
    │   │   │   ├── Spinner.jsx
    │   │   │   ├── Skeleton.jsx
    │   │   │   └── Toast.jsx
    │   │   ├── layout/
    │   │   │   ├── Navbar.jsx
    │   │   │   ├── Sidebar.jsx
    │   │   │   └── PageWrapper.jsx
    │   │   ├── auth/
    │   │   │   ├── ProtectedRoute.jsx
    │   │   │   └── GuestRoute.jsx
    │   │   ├── skills/
    │   │   │   ├── SkillCard.jsx
    │   │   │   ├── SkillProficiencySlider.jsx
    │   │   │   ├── SkillInventoryList.jsx
    │   │   │   └── AddSkillForm.jsx
    │   │   ├── ml/
    │   │   │   ├── GapAnalysisChart.jsx
    │   │   │   ├── RecommendedSkillCard.jsx
    │   │   │   └── ResourceCard.jsx
    │   │   └── events/
    │   │       ├── EventCard.jsx
    │   │       ├── EventFilter.jsx
    │   │       └── EventStatusBadge.jsx
    │   │
    │   ├── pages/                 # One file per route
    │   │   ├── auth/
    │   │   │   ├── LoginPage.jsx
    │   │   │   └── RegisterPage.jsx
    │   │   ├── dashboard/
    │   │   │   └── DashboardPage.jsx
    │   │   ├── profile/
    │   │   │   └── ProfilePage.jsx
    │   │   ├── skills/
    │   │   │   └── SkillsPage.jsx
    │   │   ├── ml/
    │   │   │   └── AIInsightsPage.jsx
    │   │   ├── events/
    │   │   │   ├── EventsPage.jsx
    │   │   │   └── EventDetailPage.jsx
    │   │   └── NotFoundPage.jsx
    │   │
    │   ├── hooks/                 # Custom React hooks
    │   │   ├── useAuth.js
    │   │   ├── useToast.js
    │   │   └── useDebounce.js
    │   │
    │   ├── context/
    │   │   └── AuthContext.jsx    # Global auth state (user, token, logout)
    │   │
    │   ├── store/
    │   │   └── queryKeys.js       # TanStack Query key factories
    │   │
    │   ├── utils/
    │   │   ├── formatDate.js
    │   │   ├── formatSkillLevel.js
    │   │   └── constants.js
    │   │
    │   ├── App.jsx                # Route definitions
    │   ├── main.jsx               # Entry point — QueryClientProvider, AuthProvider
    │   └── index.css              # Tailwind base + custom design tokens
    │
    ├── index.html
    ├── vite.config.js
    ├── tailwind.config.js
    ├── postcss.config.cjs
    ├── eslint.config.js
    ├── .env                       # VITE_API_URL=http://localhost:8000
    ├── .env.example
    └── package.json
```

---

## 2. Pages & Routes

| Route | Component | Access |
|-------|-----------|--------|
| `/login` | `LoginPage` | Guest only |
| `/register` | `RegisterPage` | Guest only |
| `/dashboard` | `DashboardPage` | Auth required |
| `/profile` | `ProfilePage` | Auth required |
| `/skills` | `SkillsPage` | Auth required |
| `/ai-insights` | `AIInsightsPage` | Auth required |
| `/events` | `EventsPage` | Auth required |
| `/events/:id` | `EventDetailPage` | Auth required |
| `*` | `NotFoundPage` | Public |

### Route Guard Rules
- **`ProtectedRoute`** — checks AuthContext. If no valid token, redirect to `/login`.
- **`GuestRoute`** — if already logged in, redirect to `/dashboard`.
- Default redirect: `/` → `/dashboard` (authed) or `/login` (not authed).

---

## 3. Component Architecture

### Layout Components
- **`Navbar`** — top bar with WorkForge logo, nav links (Dashboard, Skills, AI Insights, Events), user avatar dropdown (Profile, Logout).
- **`Sidebar`** — collapsible side navigation on desktop; hamburger menu on mobile.
- **`PageWrapper`** — wraps every page with consistent max-width, padding, and page-title slot.

### UI Primitives (Design System)
- **`Button`** — variants: `primary`, `secondary`, `ghost`, `danger`. Sizes: `sm`, `md`, `lg`. Supports `isLoading` prop that shows a spinner.
- **`Input`** — includes label, error message prop, and optional left/right icon. Integrates directly with React Hook Form's `register`.
- **`Card`** — container with border, shadow, and rounded corners. Optional `header` slot for title.
- **`Badge`** — small colored pill for skill levels, event types, status labels.
- **`Modal`** — accessible dialog rendered via React portal. Closes on backdrop click or Escape key.
- **`Spinner`** — centered circular loading indicator.
- **`Skeleton`** — shimmer placeholder blocks for loading states.
- **`Toast`** — notification popups (success / error / info). Managed by `useToast` + singleton `ToastProvider` at app root.

### Auth Components
- **`ProtectedRoute`** — reads AuthContext; shows spinner while validating token, then redirects or renders children.
- **`GuestRoute`** — redirects logged-in users away from auth pages.

---

## 4. State Management

### Strategy: TanStack Query + AuthContext (no Redux needed)

| Concern | Solution |
|---------|---------|
| Server data (skills, events, ML results) | TanStack Query — caching, background refetch, mutations |
| Auth user + JWT token | React Context + `localStorage` persistence |
| Form state | React Hook Form |
| Transient UI (modals open/closed, active tab) | Local component `useState` |

### AuthContext Shape
```js
{
  user: { id, email, name, avatar_url } | null,
  token: string | null,
  isLoading: boolean,           // true while verifying token on app load
  login(token, user) {},        // stores in localStorage + sets context
  logout() {}                   // clears localStorage + context + invalidates all queries
}
```

### TanStack Query Config
- `staleTime: 5 * 60 * 1000` (5 minutes) — avoid unnecessary refetches.
- `retry: 1` — one retry on failure before showing error.
- All query keys centralized in `src/store/queryKeys.js` to avoid typos.

---

## 5. API Layer

### Base Client — `src/api/axiosClient.js`
- `baseURL` = `import.meta.env.VITE_API_URL`
- **Request interceptor**: automatically attaches `Authorization: Bearer <token>` from localStorage on every request.
- **Response interceptor**: on 401 → clear auth state → redirect to `/login`.

### API Modules

#### `authApi.js`
```
POST  /auth/register    → Body: { name, email, password } → { user, token }
POST  /auth/login       → Body: { email, password }       → { user, token }
GET   /auth/me          → Headers: Bearer token           → { user }
```

#### `profileApi.js`
```
GET    /users/profile         → { id, name, email, bio, avatar_url, target_role }
PATCH  /users/profile         → Body: { name?, bio?, avatar_url?, target_role? } → { updated profile }
```

#### `skillsApi.js`
```
GET    /skills                → [] list of user's skills { id, name, proficiency, category }
POST   /skills                → Body: { name, proficiency } → { skill }
PATCH  /skills/:id            → Body: { proficiency }       → { updated skill }
DELETE /skills/:id            → 204 No Content
GET    /skills/catalog        → [] full catalog of available skill names (for autocomplete)
```

#### `mlApi.js`
```
POST   /ml/gap-analysis       → Body: { target_role } → { gaps: [{ skill, required, current, severity }] }
GET    /ml/recommendations    → { recommendations: [{ skill, reason, priority }] }
GET    /ml/resources/:skill   → { resources: [{ title, type, platform, url, duration }] }
```

#### `eventsApi.js`
```
GET    /events                → Query: { type?, date_from?, date_to?, skill?, location?, page? }
                              → { events: [], total, page, per_page }
GET    /events/:id            → { event detail }
POST   /events/:id/interest   → Body: { status: "interested"|"registered"|"attended" }
DELETE /events/:id/interest   → removes user interest record
```

---

## 6. Authentication Flow

1. **App Load** — `AuthContext` reads token from `localStorage`, then calls `GET /auth/me`:
   - Valid → set `user` in context, mark `isLoading: false`.
   - 401 → clear token, `user = null`, `isLoading: false`.
2. **Login** — submit form → `POST /auth/login` → store token + user → navigate to `/dashboard`.
3. **Register** — submit form → `POST /auth/register` → auto-login (same as above) → navigate to `/dashboard`.
4. **Logout** — clear `localStorage` + context → invalidate all TanStack Query caches → navigate to `/login`.
5. **Per-request auth** — Axios request interceptor injects `Bearer` token automatically.
6. **Expiry** — 401 on any request triggers response interceptor → forces logout.

---

## 7. Feature Breakdown

### 7.1 Authentication Pages

**LoginPage**
- Fields: Email, Password.
- Zod schema: email format required, password non-empty.
- Error toast on wrong credentials (shows backend message).
- Link to RegisterPage.
- On success → navigate to `/dashboard`.

**RegisterPage**
- Fields: Full Name, Email, Password, Confirm Password.
- Zod: name required, email format, password min 8 chars, passwords must match.
- On success → auto-login → navigate to `/dashboard`.

---

### 7.2 Dashboard Page

A summary overview page — gives the user a snapshot without going deep.

**Sections:**
1. **Welcome Banner** — "Welcome back, {name}" with current date.
2. **Skill Snapshot Card** — shows total skill count + donut chart (Recharts) of proficiency distribution across the 5 levels.
3. **Top Skill Gaps Card** — shows 3 highest-priority gaps from last gap analysis run. If no analysis yet, shows CTA button: "Run Your First Gap Analysis".
4. **Upcoming Events Card** — 3 nearest events the user has marked interested/registered. CTA to browse all events if empty.
5. **Quick Action Buttons** — "Add Skills", "Run Gap Analysis", "Browse Events" — navigates to respective pages.

---

### 7.3 Profile Page

**Sections:**
- Avatar display (URL field or upload placeholder for MVP).
- Editable fields: Full Name, Bio (textarea), Target Role (text input).
- React Hook Form with Zod validation.
- "Save Changes" button triggers `PATCH /users/profile`.
- Toast on save success or error.

---

### 7.4 Skills Page

**Sections:**

**Skill Inventory**
- List of the user's current skills as `SkillCard` components.
- Each card shows: skill name, proficiency (1–5 star display), category badge, Edit button, Delete button.
- Edit opens an inline form or modal to update proficiency.
- Delete shows confirmation before calling `DELETE /skills/:id`.
- Sorted by proficiency descending by default.
- Search bar to filter the inventory by name.
- Empty state with illustration + prompt to add first skill.

**Add Skill Section**
- Autocomplete input that searches `GET /skills/catalog` (debounced, 300ms).
- Proficiency slider/selector (1 = Beginner, 2 = Basic, 3 = Intermediate, 4 = Advanced, 5 = Expert).
- "Add Skill" button → `POST /skills` → invalidates skills query → skill appears in list immediately.

---

### 7.5 AI Insights Page

Three collapsible/tab-based sections.

#### Section A — Gap Analysis
- Target Role field (prefilled from profile's `target_role` if set).
- "Run Analysis" button → `POST /ml/gap-analysis`.
- Loading: skeleton cards + "Analysing your profile…" text.
- Results: `GapAnalysisChart` — Recharts horizontal bar chart comparing required vs. current proficiency per skill gap.
- Each gap listed below chart: skill name, current level, required level, severity badge (High/Medium/Low — color coded red/yellow/green).
- CTA after results: "Get Skill Recommendations" → scrolls to Section B.

#### Section B — Skill Recommendations
- Triggered by: completing Gap Analysis, or clicking "Get Recommendations" standalone.
- Calls `GET /ml/recommendations`.
- Loading: skeleton list.
- Results: ranked list of `RecommendedSkillCard` — shows skill name, priority rank, reasoning blurb, and "View Resources →" button.
- Clicking "View Resources" → opens Section C for that specific skill.

#### Section C — Resource Suggestions
- Activated when a skill is selected from Section B (or via URL query param `?skill=...`).
- Calls `GET /ml/resources/:skill`.
- Loading: skeleton list.
- Results: list of `ResourceCard` — shows resource title, type badge (Course / Article / Video / Tutorial), platform name, estimated duration, and external link button.

---

### 7.6 Events Pages

**EventsPage**
- **Filter Bar** (sticky top):
  - Type: multi-select checkboxes — Conference, Workshop, Hackathon, Meetup.
  - Date Range: two date inputs (From / To).
  - Location: text input.
  - Skill Tag: text search input.
  - "Apply Filters" + "Reset" buttons.
- **Events Grid**: responsive grid of `EventCard` components.
  - Each card: event name, date, type badge, location (or "Online"), skill tags, user's current interest status.
  - Interest toggle on the card: cycles through None → Interested → Registered → Attended.
- **Pagination**: page number display + Previous/Next buttons.
- Empty state when filters return no results.

**EventDetailPage** (route: `/events/:id`)
- Full event info: name, description, full date + time, location, organizer, skills covered (as badges).
- Interest status buttons: Interested / Registered / Attended (one active at a time, toggleable).
- Back link → returns to EventsPage.

---

## 8. Styling System

### TailwindCSS v4 — CSS-first config via `index.css`

```css
@import "tailwindcss";

@theme {
  /* Colors */
  --color-primary:       #6366f1;   /* Indigo — main brand accent */
  --color-primary-dark:  #4f46e5;   /* Hover state */
  --color-surface:       #0f172a;   /* Page background — dark navy */
  --color-surface-card:  #1e293b;   /* Card/panel background */
  --color-surface-hover: #263148;   /* Hovered rows, interactive surfaces */
  --color-border:        #334155;   /* Default border */
  --color-border-muted:  #1e293b;
  --color-text:          #f1f5f9;   /* Primary text */
  --color-text-muted:    #94a3b8;   /* Secondary/label text */
  --color-success:       #22c55e;
  --color-warning:       #f59e0b;
  --color-danger:        #ef4444;

  /* Typography */
  --font-sans: 'Inter', ui-sans-serif, system-ui;

  /* Radius */
  --radius-sm:   0.375rem;
  --radius-md:   0.75rem;
  --radius-lg:   1rem;

  /* Shadows */
  --shadow-card: 0 4px 24px rgba(0, 0, 0, 0.35);
}
```

### Visual Style
- **Dark mode only** (for MVP) — dark navy backgrounds, slate surfaces.
- **Glassmorphism cards**: `background: rgba(255,255,255,0.05); backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.1)`.
- **Gradient accents**: indigo → violet on primary buttons and hero sections.
- **Micro-animations**:
  - Card hover: `hover:-translate-y-1 transition-transform duration-200`.
  - Button press: `active:scale-95`.
  - Page transitions: fade-in via CSS `@keyframes fadeIn` on mount.
  - Skeleton shimmer on loading states.
- **Typography**: Inter loaded from Google Fonts in `index.html`.

### Responsive Layout
- Mobile-first.
- `sm (640px)` — stacked layout, hamburger menu.
- `md (768px)` — 2-column grids.
- `lg (1024px)` — sidebar visible, 3-column grids.
- `xl (1280px)` — max-width `1200px` centered container.

---

## 9. Environment & Config

### `.env` (local development)
```
VITE_API_URL=http://localhost:8000
```

### Vercel Dashboard Environment Variables (production)
```
VITE_API_URL=https://workforge-api.onrender.com
```

### `vite.config.js`
```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
})
```
> Note: No dev proxy needed — Axios baseURL uses `VITE_API_URL` directly. FastAPI has CORS configured for `localhost:5173` in development.

---

## 10. Deployment on Vercel

### Steps
1. Create `frontend/` folder in the GitHub repo root.
2. Go to [vercel.com](https://vercel.com) → New Project → Import GitHub repo.
3. Set **Root Directory** = `frontend`.
4. Framework preset: **Vite** (auto-detected).
5. Add environment variable: `VITE_API_URL` = Render backend URL.
6. Click **Deploy**. Vercel auto-deploys on every push to `main`.

### `vercel.json` (inside `frontend/`)
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```
This makes React Router work — all unknown paths serve `index.html` and React handles routing.

### Preview Deployments
Vercel creates a unique preview URL for every branch/PR automatically — useful for testing features before merging.

---

## Key Dependencies

| Package | Purpose |
|---------|---------|
| `react` + `react-dom` | UI framework |
| `react-router-dom` v7 | Client-side routing |
| `@tanstack/react-query` v5 | Server state + caching |
| `axios` | HTTP client |
| `react-hook-form` | Form state management |
| `zod` + `@hookform/resolvers` | Validation schemas |
| `recharts` | Charts (gap analysis bar chart, dashboard donut) |
| `tailwindcss` v4 | Styling |
| `vite` | Build tool + dev server |

---

*Last updated: 2026-07-29*  
*Stack: React 19 + Vite + TailwindCSS v4 | Deployed on: Vercel*
