import uuid
from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.skill import (
    AddSkillRequest,
    SkillCatalogItem,
    UpdateSkillRequest,
    UserSkillResponse,
)
from app.services import skill_service

router = APIRouter(prefix="/skills", tags=["Skills"])


@router.get(
    "/catalog",
    response_model=list[SkillCatalogItem],
    status_code=status.HTTP_200_OK,
    summary="Get full skill catalog",
)
async def get_catalog(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[SkillCatalogItem]:
    """Retrieve all skills from the catalog for search and autocomplete."""
    return await skill_service.get_skill_catalog(db)


@router.get(
    "",
    response_model=list[UserSkillResponse],
    status_code=status.HTTP_200_OK,
    summary="Get user's skill inventory",
)
async def get_skills(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[UserSkillResponse]:
    """Retrieve all skills associated with the authenticated user."""
    return await skill_service.get_user_skills(db, current_user.id)


@router.post(
    "",
    response_model=UserSkillResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add skill to inventory",
)
async def add_skill(
    data: AddSkillRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> UserSkillResponse:
    """Add a skill to the authenticated user's inventory."""
    return await skill_service.add_skill(db, current_user.id, data)


@router.patch(
    "/{skill_id}",
    response_model=UserSkillResponse,
    status_code=status.HTTP_200_OK,
    summary="Update skill proficiency",
)
async def update_skill(
    skill_id: uuid.UUID,
    data: UpdateSkillRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> UserSkillResponse:
    """Update proficiency (1-5) for a skill in the user's inventory."""
    return await skill_service.update_skill(db, current_user.id, skill_id, data)


@router.delete(
    "/{skill_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Remove skill from inventory",
)
async def delete_skill(
    skill_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Response:
    """Delete a skill from the authenticated user's inventory."""
    await skill_service.delete_skill(db, current_user.id, skill_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
