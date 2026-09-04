import uuid
from datetime import datetime, timezone
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.schemas.user import ProfileResponse, ProfileUpdateRequest


async def get_profile(db: AsyncSession, user_id: uuid.UUID) -> ProfileResponse:
    """Fetch user profile by user_id."""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    return ProfileResponse.model_validate(user)


async def update_profile(
    db: AsyncSession, user_id: uuid.UUID, data: ProfileUpdateRequest
) -> ProfileResponse:
    """Update profile fields for the specified user."""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    update_dict = data.model_dump(exclude_unset=True)
    for field, val in update_dict.items():
        setattr(user, field, val)

    user.updated_at = datetime.now(timezone.utc)

    await db.commit()
    await db.refresh(user)

    return ProfileResponse.model_validate(user)
