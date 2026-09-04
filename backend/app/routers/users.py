from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.user import DashboardResponse, ProfileResponse, ProfileUpdateRequest
from app.services import user_service

router = APIRouter(prefix="/users", tags=["Users"])


@router.get(
    "/dashboard",
    response_model=DashboardResponse,
    status_code=status.HTTP_200_OK,
    summary="Get user dashboard summary overview",
)
async def get_dashboard(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> DashboardResponse:
    """Fetch combined dashboard data including skill inventory metrics, top ML gaps, and upcoming tracked events."""
    return await user_service.get_dashboard_data(db, current_user.id)


@router.get(
    "/profile",
    response_model=ProfileResponse,
    status_code=status.HTTP_200_OK,
    summary="Get current user profile",
)
async def get_profile(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ProfileResponse:
    """Fetch profile information for the authenticated user."""
    return await user_service.get_profile(db, current_user.id)


@router.patch(
    "/profile",
    response_model=ProfileResponse,
    status_code=status.HTTP_200_OK,
    summary="Update current user profile",
)
async def update_profile(
    data: ProfileUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ProfileResponse:
    """Update profile fields (name, bio, avatar_url, target_role) for the authenticated user."""
    return await user_service.update_profile(db, current_user.id, data)
