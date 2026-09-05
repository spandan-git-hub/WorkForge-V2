import pytest
from httpx import ASGITransport, AsyncClient
from unittest.mock import patch
import uuid
from app.main import app



@pytest.mark.asyncio
async def test_global_exception_handler():
    """Test that an unhandled server exception returns 500 with standard payload."""
    transport = ASGITransport(app=app, raise_app_exceptions=False)
    async with AsyncClient(transport=transport, base_url="http://test") as test_client:
        with patch("app.routers.auth.auth_service.login_user", side_effect=RuntimeError("Database explosion")):
            res = await test_client.post(
                "/api/v1/auth/login",
                json={"email": "test@example.com", "password": "password123"},
            )
            assert res.status_code == 500
            assert res.json() == {"detail": "An unexpected error occurred"}



@pytest.mark.asyncio
async def test_profile_target_role_validation_invalid(client: AsyncClient):
    """Test that target_role in profile update is rejected if not in known roles list."""
    unique_email = f"val_role_{uuid.uuid4().hex[:8]}@example.com"
    reg_res = await client.post(
        "/api/v1/auth/register",
        json={"name": "Role Test User", "email": unique_email, "password": "password123"},
    )
    assert reg_res.status_code == 201
    token = reg_res.json()["token"]

    patch_res = await client.patch(
        "/api/v1/users/profile",
        headers={"Authorization": f"Bearer {token}"},
        json={"target_role": "Rocket Scientist 9000"},
    )
    assert patch_res.status_code == 422
    err_body = patch_res.json()
    assert "not recognized" in str(err_body).lower()


@pytest.mark.asyncio
async def test_profile_target_role_validation_valid(client: AsyncClient):
    """Test that a valid target_role (even with case difference) is accepted."""
    unique_email = f"val_role_ok_{uuid.uuid4().hex[:8]}@example.com"
    reg_res = await client.post(
        "/api/v1/auth/register",
        json={"name": "Role Test User OK", "email": unique_email, "password": "password123"},
    )
    assert reg_res.status_code == 201
    token = reg_res.json()["token"]

    patch_res = await client.patch(
        "/api/v1/users/profile",
        headers={"Authorization": f"Bearer {token}"},
        json={"target_role": "frontend developer"},
    )
    assert patch_res.status_code == 200
    assert patch_res.json()["target_role"] == "Frontend Developer"
