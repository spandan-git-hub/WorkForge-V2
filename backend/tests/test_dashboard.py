import uuid
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_get_dashboard_unauthorized(client: AsyncClient):
    # No auth header
    res1 = await client.get("/api/v1/users/dashboard")
    assert res1.status_code == 401

    # Invalid token
    res2 = await client.get(
        "/api/v1/users/dashboard",
        headers={"Authorization": "Bearer invalid.token.payload"},
    )
    assert res2.status_code == 401


@pytest.mark.asyncio
async def test_get_dashboard_empty_user(client: AsyncClient):
    unique_email = f"dash_empty_{uuid.uuid4().hex[:8]}@example.com"
    reg_res = await client.post(
        "/api/v1/auth/register",
        json={
            "name": "Blank User",
            "email": unique_email,
            "password": "strongpassword123",
        },
    )
    assert reg_res.status_code == 201
    token = reg_res.json()["token"]

    response = await client.get(
        "/api/v1/users/dashboard",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    data = response.json()

    # User info
    assert data["user"]["name"] == "Blank User"
    assert data["user"]["target_role"] is None

    # Skill count and distribution
    assert data["skill_count"] == 0
    assert data["proficiency_distribution"] == {
        "1": 0,
        "2": 0,
        "3": 0,
        "4": 0,
        "5": 0,
    }

    # Top gaps should be None when no ML analysis has been run
    assert data["top_gaps"] is None

    # Upcoming events should be empty list when no interests tracked
    assert data["upcoming_events"] == []


@pytest.mark.asyncio
async def test_get_dashboard_populated_user(client: AsyncClient):
    unique_email = f"dash_pop_{uuid.uuid4().hex[:8]}@example.com"
    reg_res = await client.post(
        "/api/v1/auth/register",
        json={
            "name": "Dev Dynamo",
            "email": unique_email,
            "password": "strongpassword123",
        },
    )
    assert reg_res.status_code == 201
    token = reg_res.json()["token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Update target role
    patch_res = await client.patch(
        "/api/v1/users/profile",
        headers=headers,
        json={"target_role": "Frontend Developer"},
    )
    assert patch_res.status_code == 200

    # 2. Add skills
    await client.post(
        "/api/v1/skills",
        headers=headers,
        json={"name": "React", "proficiency": 2},
    )
    await client.post(
        "/api/v1/skills",
        headers=headers,
        json={"name": "JavaScript", "proficiency": 3},
    )

    # 3. Run gap analysis
    gap_res = await client.post(
        "/api/v1/ml/gap-analysis",
        headers=headers,
        json={"target_role": "Frontend Developer"},
    )
    assert gap_res.status_code == 200

    # 4. Mark interest on an event
    events_res = await client.get("/api/v1/events", headers=headers)
    assert events_res.status_code == 200
    events_items = events_res.json()["items"]
    assert len(events_items) > 0
    event_id = events_items[0]["id"]

    interest_res = await client.post(
        f"/api/v1/events/{event_id}/interest",
        headers=headers,
        json={"status": "interested"},
    )
    assert interest_res.status_code == 200

    # 5. Fetch dashboard data
    dash_res = await client.get("/api/v1/users/dashboard", headers=headers)
    assert dash_res.status_code == 200
    data = dash_res.json()

    assert data["user"]["name"] == "Dev Dynamo"
    assert data["user"]["target_role"] == "Frontend Developer"
    assert data["skill_count"] == 2
    assert data["proficiency_distribution"]["2"] == 1
    assert data["proficiency_distribution"]["3"] == 1
    assert data["proficiency_distribution"]["1"] == 0

    assert data["top_gaps"] is not None
    assert len(data["top_gaps"]) <= 3
    for gap in data["top_gaps"]:
        assert "skill" in gap
        assert "severity" in gap
        assert "gap_magnitude" in gap

    assert len(data["upcoming_events"]) >= 1
    assert data["upcoming_events"][0]["user_interest_status"] == "interested"
