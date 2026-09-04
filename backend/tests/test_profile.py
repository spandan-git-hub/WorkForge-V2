import uuid
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_get_profile_success(client: AsyncClient):
    unique_email = f"profile_{uuid.uuid4().hex[:8]}@example.com"
    reg_res = await client.post(
        "/api/v1/auth/register",
        json={
            "name": "Alex Profile",
            "email": unique_email,
            "password": "strongpassword123",
        },
    )
    assert reg_res.status_code == 201
    token = reg_res.json()["token"]

    response = await client.get(
        "/api/v1/users/profile",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == unique_email
    assert data["name"] == "Alex Profile"
    assert "id" in data
    assert "created_at" in data
    assert "updated_at" in data
    assert "password_hash" not in data


@pytest.mark.asyncio
async def test_get_profile_unauthorized(client: AsyncClient):
    # No token provided
    res1 = await client.get("/api/v1/users/profile")
    assert res1.status_code == 401

    # Invalid token provided
    res2 = await client.get(
        "/api/v1/users/profile",
        headers={"Authorization": "Bearer invalid.token.value"},
    )
    assert res2.status_code == 401


@pytest.mark.asyncio
async def test_update_profile_full_success(client: AsyncClient):
    unique_email = f"profile_update_{uuid.uuid4().hex[:8]}@example.com"
    reg_res = await client.post(
        "/api/v1/auth/register",
        json={
            "name": "Jordan Dev",
            "email": unique_email,
            "password": "strongpassword123",
        },
    )
    assert reg_res.status_code == 201
    token = reg_res.json()["token"]

    update_payload = {
        "name": "Jordan Senior Dev",
        "bio": "Passionate full-stack developer with 5 years experience building web applications.",
        "avatar_url": "https://example.com/avatar.png",
        "target_role": "Full Stack Developer",
    }
    patch_res = await client.patch(
        "/api/v1/users/profile",
        headers={"Authorization": f"Bearer {token}"},
        json=update_payload,
    )
    assert patch_res.status_code == 200
    data = patch_res.json()
    assert data["name"] == "Jordan Senior Dev"
    assert data["bio"] == update_payload["bio"]
    assert data["avatar_url"] == update_payload["avatar_url"]
    assert data["target_role"] == "Full Stack Developer"

    # Verify persistence via GET /profile
    get_res = await client.get(
        "/api/v1/users/profile",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert get_res.status_code == 200
    persisted = get_res.json()
    assert persisted["name"] == "Jordan Senior Dev"
    assert persisted["bio"] == update_payload["bio"]
    assert persisted["target_role"] == "Full Stack Developer"
    assert persisted["avatar_url"] == "https://example.com/avatar.png"


@pytest.mark.asyncio
async def test_update_profile_partial(client: AsyncClient):
    unique_email = f"profile_partial_{uuid.uuid4().hex[:8]}@example.com"
    reg_res = await client.post(
        "/api/v1/auth/register",
        json={
            "name": "Original Name",
            "email": unique_email,
            "password": "strongpassword123",
        },
    )
    token = reg_res.json()["token"]

    # Only update target_role
    patch_res = await client.patch(
        "/api/v1/users/profile",
        headers={"Authorization": f"Bearer {token}"},
        json={"target_role": "ML Engineer"},
    )
    assert patch_res.status_code == 200
    data = patch_res.json()
    assert data["target_role"] == "ML Engineer"
    assert data["name"] == "Original Name"
    assert data["bio"] is None


@pytest.mark.asyncio
async def test_update_profile_unauthorized(client: AsyncClient):
    res = await client.patch(
        "/api/v1/users/profile",
        json={"bio": "Unauthorized update attempt"},
    )
    assert res.status_code == 401


@pytest.mark.asyncio
async def test_update_profile_validation_errors(client: AsyncClient):
    unique_email = f"profile_val_{uuid.uuid4().hex[:8]}@example.com"
    reg_res = await client.post(
        "/api/v1/auth/register",
        json={
            "name": "Val User",
            "email": unique_email,
            "password": "strongpassword123",
        },
    )
    token = reg_res.json()["token"]

    # Name cannot be empty
    res1 = await client.patch(
        "/api/v1/users/profile",
        headers={"Authorization": f"Bearer {token}"},
        json={"name": ""},
    )
    assert res1.status_code == 422

    # Bio too long (> 1000 chars)
    res2 = await client.patch(
        "/api/v1/users/profile",
        headers={"Authorization": f"Bearer {token}"},
        json={"bio": "x" * 1001},
    )
    assert res2.status_code == 422
