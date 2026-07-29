# WorkForge

**AI-powered skill gap analysis and career development platform.**

WorkForge helps developers identify skill gaps for their target roles, get personalized learning recommendations, and discover relevant tech events — all powered by machine learning.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + Vite + TailwindCSS v4 |
| Backend | FastAPI + SQLAlchemy 2.0 (async) + PostgreSQL |
| ML | scikit-learn + pandas + numpy |
| Auth | JWT (python-jose) + bcrypt |
| Deployment | Vercel (frontend) + Render (backend) |

## Project Structure

```
workforge/
├── frontend/          # React + Vite app
├── backend/           # FastAPI + PostgreSQL API
├── BACKEND.md         # Backend architecture doc
├── FRONTEND.md        # Frontend architecture doc
└── PRIORITY.md        # Step-by-step implementation guide
```

## Getting Started

### Backend
```bash
cd backend
python -m venv .venv
.venv\Scripts\activate        # Windows
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## License

See [LICENSE.md](LICENSE.md).
