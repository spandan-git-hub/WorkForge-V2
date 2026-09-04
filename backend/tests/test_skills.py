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
async def test_get_catalog_authenticated(client: AsyncClient):
    _, token = await create_user_and_get_token(client)
    res = await client.get(
        "/api/v1/skills/catalog",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 200
    catalog = res.json()
    assert isinstance(catalog, list)
    assert len(catalog) > 0
    item = catalog[0]
    assert "id" in item
    assert "name" in item
    assert "category" in item


@pytest.mark.asyncio
async def test_get_catalog_unauthorized(client: AsyncClient):
    res = await client.get("/api/v1/skills/catalog")
    assert res.status_code == 401


@pytest.mark.asyncio
async def test_add_skill_from_catalog(client: AsyncClient):
    _, token = await create_user_and_get_token(client)
    res = await client.post(
        "/api/v1/skills",
        headers={"Authorization": f"Bearer {token}"},
        json={"name": "Python", "proficiency": 4},
    )
    assert res.status_code == 201
    data = res.json()
    assert data["name"].lower() == "python"
    assert data["proficiency"] == 4
    assert "id" in data
    assert "skill_id" in data
    assert "category" in data


@pytest.mark.asyncio
async def test_add_skill_custom_auto_creates_catalog(client: AsyncClient):
    _, token = await create_user_and_get_token(client)
    custom_name = f"CustomSkill_{uuid.uuid4().hex[:6]}"
    res = await client.post(
        "/api/v1/skills",
        headers={"Authorization": f"Bearer {token}"},
        json={"name": custom_name, "proficiency": 3},
    )
    assert res.status_code == 201
    data = res.json()
    assert data["name"] == custom_name
    assert data["category"] == "Other"
    assert data["proficiency"] == 3

    # Verify it now appears in catalog
    cat_res = await client.get(
        "/api/v1/skills/catalog",
        headers={"Authorization": f"Bearer {token}"},
    )
    cat_items = cat_res.json()
    assert any(c["name"].lower() == custom_name.lower() for c in cat_items)


@pytest.mark.asyncio
async def test_add_skill_duplicate_conflict(client: AsyncClient):
    _, token = await create_user_and_get_token(client)
    res1 = await client.post(
        "/api/v1/skills",
        headers={"Authorization": f"Bearer {token}"},
        json={"name": "TypeScript", "proficiency": 3},
    )
    assert res1.status_code == 201

    # Adding again should fail with 409
    res2 = await client.post(
        "/api/v1/skills",
        headers={"Authorization": f"Bearer {token}"},
        json={"name": "typescript", "proficiency": 5},
    )
    assert res2.status_code == 409
    assert "already exists" in res2.json()["detail"].lower()


@pytest.mark.asyncio
async def test_add_skill_validation_error(client: AsyncClient):
    _, token = await create_user_and_get_token(client)
    # Proficiency > 5
    res1 = await client.post(
        "/api/v1/skills",
        headers={"Authorization": f"Bearer {token}"},
        json={"name": "React", "proficiency": 6},
    )
    assert res1.status_code == 422

    # Proficiency < 1
    res2 = await client.post(
        "/api/v1/skills",
        headers={"Authorization": f"Bearer {token}"},
        json={"name": "React", "proficiency": 0},
    )
    assert res2.status_code == 422

    # Empty name
    res3 = await client.post(
        "/api/v1/skills",
        headers={"Authorization": f"Bearer {token}"},
        json={"name": "", "proficiency": 3},
    )
    assert res3.status_code == 422


@pytest.mark.asyncio
async def test_get_user_skills(client: AsyncClient):
    _, token = await create_user_and_get_token(client)

    # Initially empty
    initial_res = await client.get(
        "/api/v1/skills",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert initial_res.status_code == 200
    assert initial_res.json() == []

    # Add multiple skills
    await client.post(
        "/api/v1/skills",
        headers={"Authorization": f"Bearer {token}"},
        json={"name": "HTML", "proficiency": 2},
    )
    await client.post(
        "/api/v1/skills",
        headers={"Authorization": f"Bearer {token}"},
        json={"name": "PostgreSQL", "proficiency": 5},
    )

    list_res = await client.get(
        "/api/v1/skills",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert list_res.status_code == 200
    skills = list_res.json()
    assert len(skills) == 2
    # Ordered by proficiency descending
    assert skills[0]["proficiency"] >= skills[1]["proficiency"]


@pytest.mark.asyncio
async def test_update_skill_proficiency(client: AsyncClient):
    _, token = await create_user_and_get_token(client)
    add_res = await client.post(
        "/api/v1/skills",
        headers={"Authorization": f"Bearer {token}"},
        json={"name": "Docker", "proficiency": 2},
    )
    assert add_res.status_code == 201
    user_skill_id = add_res.json()["id"]

    # Update to 5
    update_res = await client.patch(
        f"/api/v1/skills/{user_skill_id}",
        headers={"Authorization": f"Bearer {token}"},
        json={"proficiency": 5},
    )
    assert update_res.status_code == 200
    assert update_res.json()["proficiency"] == 5

    # Also check GET reflects update
    get_res = await client.get(
        "/api/v1/skills",
        headers={"Authorization": f"Bearer {token}"},
    )
    updated = next(s for s in get_res.json() if s["id"] == user_skill_id)
    assert updated["proficiency"] == 5


@pytest.mark.asyncio
async def test_update_skill_not_found(client: AsyncClient):
    _, token = await create_user_and_get_token(client)
    fake_id = str(uuid.uuid4())
    res = await client.patch(
        f"/api/v1/skills/{fake_id}",
        headers={"Authorization": f"Bearer {token}"},
        json={"proficiency": 4},
    )
    assert res.status_code == 404


@pytest.mark.asyncio
async def test_update_skill_forbidden_other_user(client: AsyncClient):
    _, token_a = await create_user_and_get_token(client, "User A")
    _, token_b = await create_user_and_get_token(client, "User B")

    add_res = await client.post(
        "/api/v1/skills",
        headers={"Authorization": f"Bearer {token_a}"},
        json={"name": "Go", "proficiency": 3},
    )
    skill_id = add_res.json()["id"]

    # User B tries to update User A's skill
    res = await client.patch(
        f"/api/v1/skills/{skill_id}",
        headers={"Authorization": f"Bearer {token_b}"},
        json={"proficiency": 5},
    )
    assert res.status_code == 403


@pytest.mark.asyncio
async def test_delete_skill_success(client: AsyncClient):
    _, token = await create_user_and_get_token(client)
    add_res = await client.post(
        "/api/v1/skills",
        headers={"Authorization": f"Bearer {token}"},
        json={"name": "Kubernetes", "proficiency": 3},
    )
    skill_id = add_res.json()["id"]

    # Delete skill
    del_res = await client.delete(
        f"/api/v1/skills/{skill_id}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert del_res.status_code == 204

    # Verify gone
    get_res = await client.get(
        "/api/v1/skills",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert not any(s["id"] == skill_id for s in get_res.json())


@pytest.mark.asyncio
async def test_delete_skill_not_found(client: AsyncClient):
    _, token = await create_user_and_get_token(client)
    fake_id = str(uuid.uuid4())
    res = await client.delete(
        f"/api/v1/skills/{fake_id}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 404


@pytest.mark.asyncio
async def test_delete_skill_forbidden_other_user(client: AsyncClient):
    _, token_a = await create_user_and_get_token(client, "User A")
    _, token_b = await create_user_and_get_token(client, "User B")

    add_res = await client.post(
        "/api/v1/skills",
        headers={"Authorization": f"Bearer {token_a}"},
        json={"name": "Rust", "proficiency": 4},
    )
    skill_id = add_res.json()["id"]

    # User B tries to delete User A's skill
    res = await client.delete(
        f"/api/v1/skills/{skill_id}",
        headers={"Authorization": f"Bearer {token_b}"},
    )
    assert res.status_code == 403
