import uuid
import pytest
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import create_access_token
from app.ml.data_loader import get_available_roles, load_role_requirements
from app.ml.gap_analyzer import GapAnalyzer, gap_analyzer
from app.ml.recommender import SkillRecommender, recommender
from app.ml.resource_suggester import ResourceSuggester, resource_suggester
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


@pytest.mark.asyncio
async def test_skill_recommender_unit():
    """Test SkillRecommender scoring algorithm, prioritization, and reasoning."""
    rec = SkillRecommender()

    # Empty gaps test
    empty_res = rec.recommend(user_skills={}, gaps=[])
    assert empty_res == []

    # Mock gaps
    gaps = [
        {"skill": "Docker", "current": 0, "required": 4, "gap_magnitude": 4, "severity": "High"},
        {"skill": "TypeScript", "current": 1, "required": 3, "gap_magnitude": 2, "severity": "Medium"},
        {"skill": "Git", "current": 2, "required": 3, "gap_magnitude": 1, "severity": "Low"},
    ]
    user_skills = {"JavaScript": 4, "React": 3}

    results = rec.recommend(user_skills=user_skills, gaps=gaps, top_n=2)
    assert len(results) == 2

    # Check structure
    for item in results:
        assert "skill" in item
        assert "priority" in item
        assert "score" in item
        assert "reason" in item
        assert item["score"] > 0
        assert len(item["reason"]) > 10

    # Priorities must be 1, 2
    assert results[0]["priority"] == 1
    assert results[1]["priority"] == 2
    assert results[0]["score"] >= results[1]["score"]


@pytest.mark.asyncio
async def test_recommendations_endpoint_unauthorized(client: AsyncClient):
    """GET /api/v1/ml/recommendations requires authentication."""
    res = await client.get("/api/v1/ml/recommendations")
    assert res.status_code == 401


@pytest.mark.asyncio
async def test_recommendations_endpoint_no_prior_analysis(client: AsyncClient):
    """GET /api/v1/ml/recommendations returns 400 when no gap analysis has been run."""
    email = f"norec_{uuid.uuid4().hex[:8]}@example.com"
    reg_res = await client.post(
        "/api/v1/auth/register",
        json={"name": "No Rec User", "email": email, "password": "password123"},
    )
    assert reg_res.status_code == 201
    token = reg_res.json()["token"]
    headers = {"Authorization": f"Bearer {token}"}

    res = await client.get("/api/v1/ml/recommendations", headers=headers)
    assert res.status_code == 400
    assert "run gap analysis first" in res.json()["detail"].lower()


@pytest.mark.asyncio
async def test_recommendations_endpoint_success(client: AsyncClient):
    """Test successful recommendation generation after gap analysis."""
    email = f"recuser_{uuid.uuid4().hex[:8]}@example.com"
    reg_res = await client.post(
        "/api/v1/auth/register",
        json={"name": "Rec User", "email": email, "password": "password123"},
    )
    assert reg_res.status_code == 201
    token = reg_res.json()["token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Add a user skill
    await client.post(
        "/api/v1/skills",
        json={"name": "Python", "proficiency": 3},
        headers=headers,
    )

    # Run gap analysis against Backend Developer
    gap_res = await client.post(
        "/api/v1/ml/gap-analysis",
        json={"target_role": "Backend Developer"},
        headers=headers,
    )
    assert gap_res.status_code == 200

    # Get recommendations
    rec_res = await client.get("/api/v1/ml/recommendations", headers=headers)
    assert rec_res.status_code == 200
    data = rec_res.json()
    assert "recommendations" in data
    recs = data["recommendations"]
    assert len(recs) > 0

    # Verify priority sequential indexing
    for i, item in enumerate(recs):
        assert item["priority"] == i + 1
        assert item["skill"]
        assert item["reason"]
        assert "target:" in item["reason"].lower() or "level" in item["reason"].lower()


@pytest.mark.asyncio
async def test_resource_suggester_unit():
    """Test ResourceSuggester unit logic: exact matches, fuzzy/typo matching, ranking, and empty query."""
    suggester = ResourceSuggester()

    # 1. Exact match
    py_res = suggester.suggest("Python")
    assert len(py_res) >= 3
    assert any("python" in r["title"].lower() for r in py_res)
    # Check fields
    for r in py_res:
        assert "title" in r
        assert "type" in r
        assert "platform" in r
        assert "url" in r

    # 2. Case insensitivity
    py_lower = suggester.suggest("python")
    assert len(py_lower) == len(py_res)
    assert py_lower[0]["title"] == py_res[0]["title"]

    # 3. Typo fuzzy matching (e.g. Pyhton -> Python)
    typo_res = suggester.suggest("Pyhton")
    assert len(typo_res) > 0
    assert any("python" in r["title"].lower() for r in typo_res)

    # 4. Fuzzy matching with whitespace/variations
    fuzzy_res = suggester.suggest("  react js  ")
    assert len(fuzzy_res) > 0

    # 5. Completely unrecognized skill
    unknown_res = suggester.suggest("XYZCompletelyNonExistentSkill999")
    assert unknown_res == []

    # 6. Empty query
    empty_res = suggester.suggest("   ")
    assert empty_res == []


@pytest.mark.asyncio
async def test_get_resources_endpoint_unauthorized(client: AsyncClient):
    """GET /api/v1/ml/resources/{skill_name} requires authentication."""
    res = await client.get("/api/v1/ml/resources/Python")
    assert res.status_code == 401


@pytest.mark.asyncio
async def test_get_resources_endpoint_exact_and_fuzzy(client: AsyncClient):
    """Test authenticated GET /api/v1/ml/resources/{skill_name} for exact, typo, and unknown skill."""
    # Register user
    email = f"resuser_{uuid.uuid4().hex[:8]}@example.com"
    reg_res = await client.post(
        "/api/v1/auth/register",
        json={"name": "Resource Tester", "email": email, "password": "password123"},
    )
    assert reg_res.status_code == 201
    token = reg_res.json()["token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Exact match for Python
    res_exact = await client.get("/api/v1/ml/resources/Python", headers=headers)
    assert res_exact.status_code == 200
    data_exact = res_exact.json()
    assert data_exact["skill"] == "Python"
    assert len(data_exact["resources"]) >= 3
    assert data_exact["resources"][0]["url"].startswith("http")

    # 2. Case insensitive
    res_case = await client.get("/api/v1/ml/resources/python", headers=headers)
    assert res_case.status_code == 200
    assert len(res_case.json()["resources"]) == len(data_exact["resources"])

    # 3. Typo fuzzy match
    res_typo = await client.get("/api/v1/ml/resources/Pyhton", headers=headers)
    assert res_typo.status_code == 200
    data_typo = res_typo.json()
    assert data_typo["skill"] == "Python"
    assert len(data_typo["resources"]) > 0

    # 4. Unknown skill
    res_unknown = await client.get("/api/v1/ml/resources/XYZRandomSkill123", headers=headers)
    assert res_unknown.status_code == 200
    data_unknown = res_unknown.json()
    assert data_unknown["resources"] == []

