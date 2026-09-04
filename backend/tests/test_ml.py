import uuid
import pytest
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import create_access_token
from app.ml.data_loader import get_available_roles, load_role_requirements
from app.ml.gap_analyzer import GapAnalyzer, gap_analyzer
from app.models.ml_analysis import MLAnalysis
from app.models.user import User


@pytest.fixture
def auth_headers():
    """Generate auth headers for an active test user."""
    def _make_headers(user_id: uuid.UUID, email: str = "testml@example.com"):
        token = create_access_token(data={"sub": str(user_id), "email": email})
        return {"Authorization": f"Bearer {token}"}
    return _make_headers


@pytest.mark.asyncio
async def test_data_loader_roles():
    """Verify role_requirements.json loads properly and provides all expected roles."""
    roles = get_available_roles()
    assert len(roles) >= 15
    assert "Frontend Developer" in roles
    assert "Backend Developer" in roles
    assert "Data Scientist" in roles

    reqs = load_role_requirements()
    assert "Frontend Developer" in reqs
    assert "React" in reqs["Frontend Developer"]
    assert reqs["Frontend Developer"]["React"] >= 1


@pytest.mark.asyncio
async def test_gap_analyzer_unit():
    """Test GapAnalyzer unit logic for severity, calculation, and sorting."""
    analyzer = GapAnalyzer()

    # User with no skills targeting Frontend Developer
    gaps_empty = analyzer.analyze({}, "Frontend Developer")
    assert len(gaps_empty) > 0
    # Every gap should have magnitude == required
    for g in gaps_empty:
        assert g["current"] == 0
        assert g["gap_magnitude"] == g["required"]

    # User with high React and low JavaScript
    # Frontend Developer requires JavaScript: 5, React: 4
    user_skills = {"React": 5, "JavaScript": 2}
    gaps = analyzer.analyze(user_skills, "Frontend Developer")

    # React should not be in gaps (meets requirement)
    skill_names = [g["skill"] for g in gaps]
    assert "React" not in skill_names
    assert "JavaScript" in skill_names

    js_gap = next(g for g in gaps if g["skill"] == "JavaScript")
    assert js_gap["current"] == 2
    assert js_gap["required"] == 5
    assert js_gap["gap_magnitude"] == 3
    assert js_gap["severity"] == "High"

    # Verify severity ordering: all High come before Medium, which come before Low
    severity_rank = {"High": 0, "Medium": 1, "Low": 2}
    ranks = [severity_rank[g["severity"]] for g in gaps]
    assert ranks == sorted(ranks)


@pytest.mark.asyncio
async def test_get_roles_endpoint(client: AsyncClient):
    """Test GET /api/v1/ml/roles unauth and auth."""
    # Unauthenticated
    res_unauth = await client.get("/api/v1/ml/roles")
    assert res_unauth.status_code == 401

    # Register user to get auth
    email = f"mltester_{uuid.uuid4().hex[:8]}@example.com"
    user_data = {
        "name": "ML Tester",
        "email": email,
        "password": "password123",
    }
    reg_res = await client.post("/api/v1/auth/register", json=user_data)
    assert reg_res.status_code == 201
    token = reg_res.json()["token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Authenticated
    res_auth = await client.get("/api/v1/ml/roles", headers=headers)
    assert res_auth.status_code == 200
    roles = res_auth.json()
    assert isinstance(roles, list)
    assert len(roles) >= 15
    assert "Frontend Developer" in roles


@pytest.mark.asyncio
async def test_run_gap_analysis_endpoint(client: AsyncClient):
    """Test POST /api/v1/ml/gap-analysis flow, calculations, and DB storage."""
    # Register unique user
    email = f"gapuser_{uuid.uuid4().hex[:8]}@example.com"
    reg_res = await client.post(
        "/api/v1/auth/register",
        json={"name": "Gap User", "email": email, "password": "password123"},
    )
    assert reg_res.status_code == 201
    token = reg_res.json()["token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Unauthenticated check
    res_unauth = await client.post(
        "/api/v1/ml/gap-analysis",
        json={"target_role": "Frontend Developer"},
    )
    assert res_unauth.status_code == 401

    # Invalid role check
    res_invalid = await client.post(
        "/api/v1/ml/gap-analysis",
        json={"target_role": "NonExistentRole123"},
        headers=headers,
    )
    assert res_invalid.status_code == 400
    assert "not recognized" in res_invalid.json()["detail"].lower()

    # Add skills for this user
    # Target: Frontend Developer requires React: 4, JavaScript: 5, HTML5: 5, CSS3: 4
    await client.post(
        "/api/v1/skills",
        json={"name": "React", "proficiency": 4},
        headers=headers,
    )
    await client.post(
        "/api/v1/skills",
        json={"name": "JavaScript", "proficiency": 2},
        headers=headers,
    )

    # Run gap analysis
    res = await client.post(
        "/api/v1/ml/gap-analysis",
        json={"target_role": "Frontend Developer"},
        headers=headers,
    )
    assert res.status_code == 200
    data = res.json()
    assert data["target_role"] == "Frontend Developer"
    assert "ran_at" in data
    gaps = data["gaps"]
    assert len(gaps) > 0

    # React (prof 4 vs req 4) should NOT be in gaps
    gap_skills = [g["skill"] for g in gaps]
    assert "React" not in gap_skills
    assert "JavaScript" in gap_skills

    # JavaScript gap verification (5 - 2 = 3 -> High)
    js_gap = next(g for g in gaps if g["skill"] == "JavaScript")
    assert js_gap["current"] == 2
    assert js_gap["required"] == 5
    assert js_gap["gap_magnitude"] == 3
    assert js_gap["severity"] == "High"

    # Verify order: High -> Medium -> Low
    severity_order = {"High": 0, "Medium": 1, "Low": 2}
    severities = [severity_order[g["severity"]] for g in gaps]
    assert severities == sorted(severities)
