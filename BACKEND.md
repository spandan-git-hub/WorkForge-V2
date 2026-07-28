# WorkForge — Backend Plan

**Stack:** Python 3.12, FastAPI, SQLAlchemy 2.0 (async), Alembic, PostgreSQL, scikit-learn, Pydantic v2  
**Deployment:** Render (Web Service)  
**Database Hosting:** Render PostgreSQL (or Supabase PostgreSQL for generous free tier)

---

## Table of Contents
1. [Project Structure](#1-project-structure)
2. [Tech Stack Details](#2-tech-stack-details)
3. [Database Schema](#3-database-schema)
4. [API Endpoints](#4-api-endpoints)
5. [Authentication System](#5-authentication-system)
6. [Feature Breakdown](#6-feature-breakdown)
7. [ML Pipeline](#7-ml-pipeline)
8. [Configuration & Environment](#8-configuration--environment)
9. [Deployment on Render](#9-deployment-on-render)
10. [Key Dependencies](#10-key-dependencies)

---

## 1. Project Structure

```
workforge/
└── backend/
    ├── app/
    │   ├── __init__.py
    │   ├── main.py                # FastAPI app factory, middleware, routers
    │   │
    │   ├── core/
    │   │   ├── config.py          # Pydantic Settings — reads from .env
    │   │   ├── security.py        # JWT creation, verification, password hashing
    │   │   └── dependencies.py    # get_db(), get_current_user() FastAPI deps
    │   │
    │   ├── db/
    │   │   ├── base.py            # SQLAlchemy Base, engine, session factory
    │   │   └── session.py         # AsyncSession dependency
    │   │
    │   ├── models/                # SQLAlchemy ORM models (one per table)
    │   │   ├── user.py
    │   │   ├── skill.py
    │   │   ├── user_skill.py
    │   │   ├── event.py
    │   │   ├── event_interest.py
    │   │   └── ml_analysis.py
    │   │
    │   ├── schemas/               # Pydantic v2 request/response schemas
    │   │   ├── auth.py
    │   │   ├── user.py
    │   │   ├── skill.py
    │   │   ├── event.py
    │   │   └── ml.py
    │   │
    │   ├── routers/               # FastAPI routers — one per feature domain
    │   │   ├── auth.py
    │   │   ├── users.py
    │   │   ├── skills.py
    │   │   ├── events.py
    │   │   └── ml.py
    │   │
    │   ├── services/              # Business logic, decoupled from HTTP layer
    │   │   ├── auth_service.py
    │   │   ├── user_service.py
    │   │   ├── skill_service.py
    │   │   ├── event_service.py
    │   │   └── ml_service.py
    │   │
    │   └── ml/                    # ML pipeline — isolated from API layer
    │       ├── gap_analyzer.py    # scikit-learn Gap Analysis model
    │       ├── recommender.py     # Collaborative filtering / ranking model
    │       ├── resource_suggester.py  # NLP-based resource matching
    │       ├── data_loader.py     # Load skill catalog, role requirements data
    │       └── models/            # Serialized trained model files (.pkl, .joblib)
    │           ├── gap_model.joblib
    │           └── recommender_model.joblib
    │
    ├── alembic/                   # Database migrations
    │   ├── env.py
    │   ├── script.py.mako
    │   └── versions/
    │       └── 0001_initial_schema.py
    │
    ├── data/                      # Static seed data (JSON/CSV)
    │   ├── skill_catalog.json     # All known skills with categories
    │   └── role_requirements.json # Role → required skills + proficiency levels
    │
    ├── tests/
    │   ├── conftest.py
    │   ├── test_auth.py
    │   ├── test_skills.py
    │   ├── test_events.py
    │   └── test_ml.py
    │
    ├── .env                       # Local environment variables
    ├── .env.example
    ├── requirements.txt           # Python dependencies
    ├── alembic.ini
    └── Procfile                   # For Render: web: uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

---

## 2. Tech Stack Details

| Layer | Technology | Why |
|-------|-----------|-----|
| Framework | FastAPI | Async, auto-docs (Swagger/ReDoc), Pydantic validation, fast |
| ORM | SQLAlchemy 2.0 (async) | Powerful, well-supported, async support |
| Migrations | Alembic | Standard migration tool for SQLAlchemy |
| Validation | Pydantic v2 | Request/response schemas, settings management |
| Auth | JWT (python-jose) + bcrypt (passlib) | Industry standard |
| Database | PostgreSQL 15+ | ACID, relational, excellent with SQLAlchemy |
| ML | scikit-learn, pandas, numpy | Mature, well-documented ML ecosystem |
| NLP (resources) | sentence-transformers (optional for MVP: simple scoring) | Semantic similarity for resource matching |
| Server | Uvicorn (ASGI) | Fast async server for FastAPI |
| Testing | pytest + httpx | Async-capable API testing |

---

## 3. Database Schema

### Tables

#### `users`
```sql
id            UUID        PRIMARY KEY DEFAULT gen_random_uuid()
email         VARCHAR     UNIQUE NOT NULL
name          VARCHAR     NOT NULL
password_hash VARCHAR     NOT NULL
bio           TEXT
avatar_url    VARCHAR
target_role   VARCHAR
created_at    TIMESTAMP   DEFAULT NOW()
updated_at    TIMESTAMP   DEFAULT NOW()
```

#### `skill_catalog`
```sql
id            UUID        PRIMARY KEY DEFAULT gen_random_uuid()
name          VARCHAR     UNIQUE NOT NULL   -- e.g., "Python", "React", "Docker"
category      VARCHAR     NOT NULL          -- e.g., "Programming Language", "Framework", "DevOps"
description   TEXT
```

#### `user_skills`  *(join table — user's personal skill inventory)*
```sql
id            UUID        PRIMARY KEY DEFAULT gen_random_uuid()
user_id       UUID        FK → users.id ON DELETE CASCADE
skill_id      UUID        FK → skill_catalog.id ON DELETE CASCADE
proficiency   SMALLINT    NOT NULL CHECK (proficiency BETWEEN 1 AND 5)
created_at    TIMESTAMP   DEFAULT NOW()
updated_at    TIMESTAMP   DEFAULT NOW()
UNIQUE (user_id, skill_id)
```

#### `events`
```sql
id            UUID        PRIMARY KEY DEFAULT gen_random_uuid()
name          VARCHAR     NOT NULL
description   TEXT
event_type    VARCHAR     NOT NULL  -- 'conference' | 'workshop' | 'hackathon' | 'meetup'
start_date    TIMESTAMP   NOT NULL
end_date      TIMESTAMP
location      VARCHAR               -- city name or 'Online'
organizer     VARCHAR
skills        VARCHAR[]             -- array of skill name tags
url           VARCHAR
created_at    TIMESTAMP   DEFAULT NOW()
```

#### `event_interests`
```sql
id            UUID        PRIMARY KEY DEFAULT gen_random_uuid()
user_id       UUID        FK → users.id ON DELETE CASCADE
event_id      UUID        FK → events.id ON DELETE CASCADE
status        VARCHAR     NOT NULL  -- 'interested' | 'registered' | 'attended'
created_at    TIMESTAMP   DEFAULT NOW()
updated_at    TIMESTAMP   DEFAULT NOW()
UNIQUE (user_id, event_id)
```

#### `ml_analyses`  *(stores results of each gap analysis run)*
```sql
id            UUID        PRIMARY KEY DEFAULT gen_random_uuid()
user_id       UUID        FK → users.id ON DELETE CASCADE
target_role   VARCHAR     NOT NULL
gaps          JSONB       NOT NULL  -- [{ skill, required, current, severity }]
ran_at        TIMESTAMP   DEFAULT NOW()
```

### Relationships Summary
```
users ──< user_skills >── skill_catalog
users ──< event_interests >── events
users ──< ml_analyses
```

---

## 4. API Endpoints

All endpoints prefixed with `/api/v1`.  
Auto-generated interactive docs at `/docs` (Swagger UI) and `/redoc`.

### Auth — `/api/v1/auth`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/register` | None | Create new account → returns `{ user, token }` |
| POST | `/auth/login` | None | Login → returns `{ user, token }` |
| GET | `/auth/me` | Required | Returns current user from JWT |

### Users / Profile — `/api/v1/users`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/users/profile` | Required | Get current user's full profile |
| PATCH | `/users/profile` | Required | Update name, bio, avatar_url, target_role |

### Skills — `/api/v1/skills`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/skills` | Required | List current user's skill inventory |
| POST | `/skills` | Required | Add a skill to inventory |
| PATCH | `/skills/{skill_id}` | Required | Update proficiency level |
| DELETE | `/skills/{skill_id}` | Required | Remove from inventory |
| GET | `/skills/catalog` | Required | Get full catalog of available skills (for autocomplete) |

### Events — `/api/v1/events`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/events` | Required | Paginated list, filtered by type/date/location/skill |
| GET | `/events/{event_id}` | Required | Single event detail |
| POST | `/events/{event_id}/interest` | Required | Mark status: interested/registered/attended |
| DELETE | `/events/{event_id}/interest` | Required | Remove interest record |

### ML — `/api/v1/ml`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/ml/gap-analysis` | Required | Run gap analysis for a target role |
| GET | `/ml/recommendations` | Required | Get ranked skill recommendations |
| GET | `/ml/resources/{skill_name}` | Required | Get resource suggestions for a skill |

### System

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | None | API info |
| GET | `/health` | None | Health check → `{ status: "ok" }` |

---

## 5. Authentication System

### Method: JWT (JSON Web Tokens) — Stateless

### Flow
1. User registers or logs in.
2. Server verifies credentials, creates a signed JWT.
3. JWT is returned to the client. Client stores it in `localStorage`.
4. Client sends JWT in every request as `Authorization: Bearer <token>`.
5. Server's `get_current_user` dependency decodes and validates the JWT on protected routes.
6. No session storage server-side — fully stateless.

### JWT Payload
```json
{
  "sub": "<user_id>",
  "email": "<email>",
  "exp": <unix_timestamp>,
  "iat": <unix_timestamp>
}
```

### Token Config
- **Algorithm**: HS256
- **Expiry**: 7 days (configurable via `JWT_EXPIRY_DAYS` env var)
- **Secret**: `JWT_SECRET` env var (strong random string in production)

### Password Security
- `passlib[bcrypt]` for hashing. Bcrypt with `rounds=12`.
- Passwords never stored in plain text.
- `verify_password(plain, hash)` and `hash_password(plain)` utilities in `core/security.py`.

### `get_current_user` FastAPI Dependency
```python
async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
) -> User:
    payload = decode_jwt(token)          # raises 401 if invalid/expired
    user = await get_user_by_id(db, payload["sub"])
    if not user:
        raise HTTPException(401)
    return user
```

---

## 6. Feature Breakdown

### 6.1 Auth Endpoints

**`POST /auth/register`**
- Input: `{ name, email, password }`
- Validate: email uniqueness, password min length.
- Hash password → save user to DB → generate JWT → return `{ user, token }`.

**`POST /auth/login`**
- Input: `{ email, password }`
- Find user by email. Verify bcrypt hash. If invalid → 401.
- Generate JWT → return `{ user, token }`.

**`GET /auth/me`**
- Protected by `get_current_user` dependency.
- Returns current user's profile fields (excludes `password_hash`).

---

### 6.2 User Profile

**`GET /users/profile`**
- Returns full user profile: id, name, email, bio, avatar_url, target_role, created_at.

**`PATCH /users/profile`**
- Accepts any subset of: `{ name, bio, avatar_url, target_role }`.
- Validates non-empty strings where provided.
- Updates `updated_at` automatically.
- Returns updated profile.

---

### 6.3 Skills Management

**Skill Catalog** (`data/skill_catalog.json`) — seeded at startup
- Loaded from a JSON file containing ~200+ skills with categories.
- Stored in `skill_catalog` table.
- `GET /skills/catalog` returns this full list for frontend autocomplete.

**User Skill Inventory**
- `GET /skills` — fetch all `user_skills` for current user, joined with `skill_catalog` for name/category.
- `POST /skills` — find skill by name in catalog (create if not exists), insert into `user_skills`. Check for duplicates (return 409 if already exists).
- `PATCH /skills/{skill_id}` — update `proficiency` field on `user_skills` row. Verify the skill belongs to the requesting user.
- `DELETE /skills/{skill_id}` — delete from `user_skills`. Verify ownership.

---

### 6.4 Events Management

**Event data** — seeded from `data/events_seed.json` (create a set of realistic example events on first startup), or populated manually via admin later.

**`GET /events`** — Query params:
- `type` — filter by event_type (multi-value: `?type=conference&type=hackathon`)
- `date_from` / `date_to` — ISO date strings
- `location` — partial string match on `location` field
- `skill` — match against `skills` array field
- `page` (default 1), `per_page` (default 12)
- Returns: `{ items: [...], total, page, per_page, pages }`
- Each event item includes the current user's interest status if any.

**`GET /events/{event_id}`** — Full detail, includes current user's interest status.

**`POST /events/{event_id}/interest`** — Body: `{ status }`. Upserts `event_interests` row.

**`DELETE /events/{event_id}/interest`** — Deletes the user's interest record for the event.

---

## 7. ML Pipeline

The ML features live in `app/ml/` and are called by `services/ml_service.py`. They use real scikit-learn algorithms — not rules-based or hard-coded.

### Data Foundation

#### `data/role_requirements.json`
Defines what each role requires. Example:
```json
{
  "Frontend Developer": {
    "React": 4, "HTML": 5, "CSS": 4, "JavaScript": 5,
    "TypeScript": 3, "Git": 3, "REST APIs": 3
  },
  "Data Scientist": {
    "Python": 5, "Machine Learning": 4, "SQL": 4,
    "Pandas": 4, "NumPy": 3, "Statistics": 4, "Data Visualization": 3
  },
  "DevOps Engineer": {
    "Docker": 4, "Kubernetes": 3, "CI/CD": 4, "Linux": 4,
    "AWS": 3, "Terraform": 3, "Git": 4
  }
  // ... ~15-20 roles covering major tech tracks
}
```

### 7.1 Gap Analyzer (`app/ml/gap_analyzer.py`)

**Algorithm:** Cosine similarity + gap magnitude scoring.

**Process:**
1. Receive `user_id` + `target_role`.
2. Load user's current skill inventory: `{ skill_name: proficiency }` dict.
3. Load `role_requirements` for `target_role`.
4. For each required skill:
   - Compute gap = `required_proficiency - current_proficiency` (0 if user already meets it or exceeds it).
   - Classify severity: `gap >= 3` → High, `gap == 2` → Medium, `gap == 1` → Low, `gap <= 0` → None.
5. Use a simple linear regression model (trained on synthetic user-role data) to weight gaps by importance.
6. Return sorted list of gaps (highest severity first).
7. Persist result in `ml_analyses` table.

**Training:** Offline, run once. Trains on generated data pairing user skill vectors with role requirement vectors. Saved as `gap_model.joblib`.

**Libraries:** `scikit-learn` (LinearRegression or Ridge), `numpy`, `joblib`.

---

### 7.2 Skill Recommender (`app/ml/recommender.py`)

**Algorithm:** Content-based filtering with skill co-occurrence weighting.

**Process:**
1. Load gap analysis results (from `ml_analyses` for the user).
2. Load skill co-occurrence data — which skills are frequently learned together (built from `role_requirements.json` — skills that co-appear across roles).
3. Rank gap skills using a weighted score:
   - Gap magnitude (weight: 0.5)
   - Co-occurrence with skills user already has (weight: 0.3) — surface skills that build naturally on current inventory
   - Role frequency — how commonly this skill appears across all roles (weight: 0.2)
4. Return top-N recommended skills with reasoning string per item.

**Libraries:** `scikit-learn` (TfidfVectorizer for skill text, cosine_similarity), `pandas`, `numpy`.

---

### 7.3 Resource Suggester (`app/ml/resource_suggester.py`)

**Data Source:** A curated JSON dataset (`data/skill_resources.json`) — preloaded list of learning resources per skill, including Coursera courses, freeCodeCamp tutorials, official docs, YouTube channels, books.

**Algorithm:** TF-IDF similarity matching + simple scoring.

**Process:**
1. Receive `skill_name`.
2. Normalize skill name (lowercase, strip).
3. Direct lookup in `skill_resources.json` for exact match.
4. If no exact match: use TF-IDF cosine similarity to find the closest skill's resources.
5. Score each resource:
   - Recency score (newer = higher).
   - Type diversity bonus (return a mix: 1 course, 1 video, 1 article, 1 doc ideally).
   - Platform reliability weight (Coursera/Udemy/official docs > random blogs).
6. Return top 5–8 resources, sorted by score.

**Libraries:** `scikit-learn` (TfidfVectorizer), `numpy`.

---

### ML Endpoint Behavior

**`POST /ml/gap-analysis`**
- Body: `{ target_role: str }`
- Validates `target_role` exists in `role_requirements.json`.
- Calls `gap_analyzer.analyze(user_id, target_role)`.
- Stores result in `ml_analyses`.
- Returns: `{ target_role, gaps: [{ skill, current, required, gap_magnitude, severity }] }`.

**`GET /ml/recommendations`**
- Fetches the most recent `ml_analyses` record for the user.
- If no analysis exists, returns 400 with message "Run gap analysis first".
- Calls `recommender.recommend(user_id, latest_gaps)`.
- Returns: `{ recommendations: [{ skill, priority, reason }] }`.

**`GET /ml/resources/{skill_name}`**
- Calls `resource_suggester.suggest(skill_name)`.
- Returns: `{ skill, resources: [{ title, type, platform, url, duration }] }`.

---

## 8. Configuration & Environment

### `app/core/config.py` — Pydantic Settings
```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str
    JWT_SECRET: str
    JWT_EXPIRY_DAYS: int = 7
    FRONTEND_URL: str                    # For CORS
    ENVIRONMENT: str = "development"

    class Config:
        env_file = ".env"

settings = Settings()
```

### `.env` (local development)
```
DATABASE_URL=postgresql+asyncpg://postgres:password@localhost:5432/workforge
JWT_SECRET=your-very-long-random-secret-key-here
JWT_EXPIRY_DAYS=7
FRONTEND_URL=http://localhost:5173
ENVIRONMENT=development
```

### `.env` (Render production — set in Render dashboard)
```
DATABASE_URL=postgresql+asyncpg://<render-db-connection-string>
JWT_SECRET=<strong-production-secret>
FRONTEND_URL=https://workforge.vercel.app
ENVIRONMENT=production
```

### CORS Configuration (`app/main.py`)
```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## 9. Deployment on Render

### Service Type: **Web Service**

### Steps
1. Push `backend/` to GitHub.
2. Go to [render.com](https://render.com) → New → Web Service.
3. Connect GitHub repo.
4. Settings:
   - **Root Directory**: `backend`
   - **Runtime**: Python 3
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Add environment variables in Render dashboard (all from `.env` example above).
6. Attach a Render PostgreSQL instance (or point to Supabase).
7. Deploy.

### `Procfile` (inside `backend/`)
```
web: uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

### Database Migrations on Deploy
Add migration step to build command:
```
pip install -r requirements.txt && alembic upgrade head
```
This runs all pending migrations automatically on every deploy.

### Health Check
Render will ping `GET /health` to verify the service is live.

### Free Tier Caveats
- Render free tier spins down after 15 minutes of inactivity (cold start ~30s on next request).
- For production use, upgrade to the Starter plan ($7/mo) to keep it always-on.

---

## 10. Key Dependencies

### `requirements.txt`
```
fastapi==0.115.0
uvicorn[standard]==0.30.0
sqlalchemy[asyncio]==2.0.36
asyncpg==0.30.0                  # Async PostgreSQL driver
alembic==1.14.0
pydantic==2.10.0
pydantic-settings==2.6.0
python-jose[cryptography]==3.3.0  # JWT
passlib[bcrypt]==1.7.4            # Password hashing
python-multipart==0.0.17          # For form data
httpx==0.28.0                     # Async HTTP client (for tests)
pytest==8.3.0
pytest-asyncio==0.24.0

# ML dependencies
scikit-learn==1.5.2
pandas==2.2.3
numpy==2.1.3
joblib==1.4.2
sentence-transformers==3.3.0     # Optional: for semantic resource matching
```

---

## Error Handling Convention

All errors returned as:
```json
{
  "detail": "Human-readable error message here"
}
```

| HTTP Status | When Used |
|-------------|----------|
| 200 | Success |
| 201 | Resource created |
| 204 | Delete success (no body) |
| 400 | Bad request (invalid input, business rule violation) |
| 401 | Unauthenticated (missing/invalid/expired token) |
| 403 | Forbidden (authenticated but not authorized) |
| 404 | Resource not found |
| 409 | Conflict (e.g. duplicate skill, email already registered) |
| 422 | Pydantic validation error (auto-handled by FastAPI) |
| 500 | Unexpected server error |

---

*Last updated: 2026-07-29*  
*Stack: Python 3.12 + FastAPI + PostgreSQL + scikit-learn | Deployed on: Render*
