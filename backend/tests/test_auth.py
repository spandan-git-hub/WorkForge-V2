import uuid
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_register_success(client: AsyncClient):
    unique_email = f"test_{uuid.uuid4().hex[:8]}@example.com"
    payload = {
        "name": "Jane Developer",
        "email": unique_email,
        "password": "strongpassword123",
    }
    response = await client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert "token" in data
    assert "user" in data
    assert data["user"]["email"] == unique_email
    assert data["user"]["name"] == "Jane Developer"
    assert "password_hash" not in data["user"]


@pytest.mark.asyncio
async def test_register_duplicate_email(client: AsyncClient):
    unique_email = f"duplicate_{uuid.uuid4().hex[:8]}@example.com"
    payload = {
        "name": "First User",
        "email": unique_email,
        "password": "strongpassword123",
    }
    # Register first time
    res1 = await client.post("/api/v1/auth/register", json=payload)
    assert res1.status_code == 201
    
    # Register again with same email
    res2 = await client.post("/api/v1/auth/register", json=payload)
    assert res2.status_code == 409
    assert "already exists" in res2.json()["detail"].lower()


@pytest.mark.asyncio
async def test_register_invalid_password(client: AsyncClient):
    payload = {
        "name": "Short Pass User",
        "email": f"short_{uuid.uuid4().hex[:8]}@example.com",
        "password": "short",
    }
    response = await client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_login_success(client: AsyncClient):
    unique_email = f"login_{uuid.uuid4().hex[:8]}@example.com"
    password = "password12345"
    reg_payload = {
        "name": "Login User",
        "email": unique_email,
        "password": password,
    }
    await client.post("/api/v1/auth/register", json=reg_payload)

    login_payload = {
        "email": unique_email,
        "password": password,
    }
    response = await client.post("/api/v1/auth/login", json=login_payload)
    assert response.status_code == 200
    data = response.json()
    assert "token" in data
    assert data["user"]["email"] == unique_email


@pytest.mark.asyncio
async def test_login_invalid_password(client: AsyncClient):
    unique_email = f"wrongpass_{uuid.uuid4().hex[:8]}@example.com"
    reg_payload = {
        "name": "Wrong Pass User",
        "email": unique_email,
        "password": "correctpassword123",
    }
    await client.post("/api/v1/auth/register", json=reg_payload)

    login_payload = {
        "email": unique_email,
        "password": "incorrectpassword",
    }
    response = await client.post("/api/v1/auth/login", json=login_payload)
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_login_nonexistent_email(client: AsyncClient):
    login_payload = {
        "email": f"nonexistent_{uuid.uuid4().hex[:8]}@example.com",
        "password": "somepassword123",
    }
    response = await client.post("/api/v1/auth/login", json=login_payload)
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_get_me_success(client: AsyncClient):
    unique_email = f"me_{uuid.uuid4().hex[:8]}@example.com"
    reg_payload = {
        "name": "Me User",
        "email": unique_email,
        "password": "validpassword123",
    }
    reg_res = await client.post("/api/v1/auth/register", json=reg_payload)
    token = reg_res.json()["token"]

    response = await client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == unique_email
    assert data["name"] == "Me User"


@pytest.mark.asyncio
async def test_get_me_unauthorized(client: AsyncClient):
    # Without token
    res1 = await client.get("/api/v1/auth/me")
    assert res1.status_code == 401

    # With invalid token
    res2 = await client.get(
        "/api/v1/auth/me",
        headers={"Authorization": "Bearer invalid_token_123"},
    )
    assert res2.status_code == 401
