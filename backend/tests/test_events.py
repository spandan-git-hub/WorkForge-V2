import uuid
import pytest
from httpx import AsyncClient


async def create_user_and_get_token(client: AsyncClient, name: str = "Test User") -> tuple[dict, str]:
    email = f"user_{uuid.uuid4().hex[:8]}@example.com"
    res = await client.post(
        "/api/v1/auth/register",
        json={
            "name": name,
            "email": email,
            "password": "password123",
        },
    )
    assert res.status_code == 201
    data = res.json()
    return data["user"], data["token"]


@pytest.mark.asyncio
async def test_get_events_unauthorized(client: AsyncClient):
    res = await client.get("/api/v1/events")
    assert res.status_code == 401


@pytest.mark.asyncio
async def test_get_events_paginated_and_initial_status(client: AsyncClient):
    _, token = await create_user_and_get_token(client)
    res = await client.get(
        "/api/v1/events",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 200
    data = res.json()
    assert "items" in data
    assert "total" in data
    assert "page" in data
    assert "per_page" in data
    assert "pages" in data
    assert data["total"] > 0
    assert len(data["items"]) > 0

    first = data["items"][0]
    assert "id" in first
    assert "name" in first
    assert "event_type" in first
    assert "start_date" in first
    assert "skills" in first
    assert first["user_interest_status"] is None


@pytest.mark.asyncio
async def test_filter_events_by_type(client: AsyncClient):
    _, token = await create_user_and_get_token(client)
    res = await client.get(
        "/api/v1/events?type=hackathon",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 200
    data = res.json()
    for item in data["items"]:
        assert item["event_type"].lower() == "hackathon"


@pytest.mark.asyncio
async def test_filter_events_by_date(client: AsyncClient):
    _, token = await create_user_and_get_token(client)
    res = await client.get(
        "/api/v1/events?date_from=2026-09-01T00:00:00Z",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 200
    data = res.json()
    for item in data["items"]:
        assert item["start_date"] >= "2026-09-01"


@pytest.mark.asyncio
async def test_filter_events_by_location_and_skill(client: AsyncClient):
    _, token = await create_user_and_get_token(client)

    # Location filter
    res_loc = await client.get(
        "/api/v1/events?location=Online",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res_loc.status_code == 200
    data_loc = res_loc.json()
    for item in data_loc["items"]:
        assert "online" in (item["location"] or "").lower()

    # Skill filter
    res_skill = await client.get(
        "/api/v1/events?skill=Python",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res_skill.status_code == 200
    data_skill = res_skill.json()
    for item in data_skill["items"]:
        assert any("python" in s.lower() for s in item["skills"])


@pytest.mark.asyncio
async def test_event_detail_and_interest_lifecycle(client: AsyncClient):
    _, token = await create_user_and_get_token(client)
    auth_header = {"Authorization": f"Bearer {token}"}

    # 1. Fetch first event
    list_res = await client.get("/api/v1/events?per_page=1", headers=auth_header)
    assert list_res.status_code == 200
    event_item = list_res.json()["items"][0]
    event_id = event_item["id"]

    # 2. Get event detail
    detail_res = await client.get(f"/api/v1/events/{event_id}", headers=auth_header)
    assert detail_res.status_code == 200
    detail = detail_res.json()
    assert detail["id"] == event_id
    assert detail["user_interest_status"] is None
    assert "description" in detail
    assert "organizer" in detail

    # 3. Mark interest as "interested"
    post_res = await client.post(
        f"/api/v1/events/{event_id}/interest",
        headers=auth_header,
        json={"status": "interested"},
    )
    assert post_res.status_code == 200
    interest_data = post_res.json()
    assert interest_data["status"] == "interested"
    assert interest_data["event_id"] == event_id

    # 4. Verify in detail view
    detail_res2 = await client.get(f"/api/v1/events/{event_id}", headers=auth_header)
    assert detail_res2.status_code == 200
    assert detail_res2.json()["user_interest_status"] == "interested"

    # 5. Verify in list view
    list_res2 = await client.get("/api/v1/events", headers=auth_header)
    assert list_res2.status_code == 200
    matching = [e for e in list_res2.json()["items"] if e["id"] == event_id]
    assert len(matching) == 1
    assert matching[0]["user_interest_status"] == "interested"

    # 6. Update interest to "registered"
    update_res = await client.post(
        f"/api/v1/events/{event_id}/interest",
        headers=auth_header,
        json={"status": "registered"},
    )
    assert update_res.status_code == 200
    assert update_res.json()["status"] == "registered"

    detail_res3 = await client.get(f"/api/v1/events/{event_id}", headers=auth_header)
    assert detail_res3.json()["user_interest_status"] == "registered"

    # 7. Delete interest
    del_res = await client.delete(f"/api/v1/events/{event_id}/interest", headers=auth_header)
    assert del_res.status_code == 204

    # 8. Verify status is back to null
    detail_res4 = await client.get(f"/api/v1/events/{event_id}", headers=auth_header)
    assert detail_res4.json()["user_interest_status"] is None


@pytest.mark.asyncio
async def test_event_not_found_errors(client: AsyncClient):
    _, token = await create_user_and_get_token(client)
    auth_header = {"Authorization": f"Bearer {token}"}
    fake_id = str(uuid.uuid4())

    # Get nonexistent event
    res = await client.get(f"/api/v1/events/{fake_id}", headers=auth_header)
    assert res.status_code == 404

    # Post interest to nonexistent event
    res = await client.post(
        f"/api/v1/events/{fake_id}/interest",
        headers=auth_header,
        json={"status": "interested"},
    )
    assert res.status_code == 404

    # Delete interest that does not exist
    res = await client.delete(f"/api/v1/events/{fake_id}/interest", headers=auth_header)
    assert res.status_code == 404
