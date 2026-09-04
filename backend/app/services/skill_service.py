import uuid
from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.skill import SkillCatalog
from app.models.user_skill import UserSkill
from app.schemas.skill import (
    AddSkillRequest,
    SkillCatalogItem,
    UpdateSkillRequest,
    UserSkillResponse,
)


async def get_skill_catalog(db: AsyncSession) -> list[SkillCatalogItem]:
    """Retrieve all skills from the catalog, ordered by category and name."""
    stmt = select(SkillCatalog).order_by(SkillCatalog.category.asc(), SkillCatalog.name.asc())
    result = await db.execute(stmt)
    skills = result.scalars().all()
    return [SkillCatalogItem.model_validate(s) for s in skills]


async def get_user_skills(db: AsyncSession, user_id: uuid.UUID) -> list[UserSkillResponse]:
    """Retrieve all skills in the authenticated user's inventory."""
    stmt = (
        select(UserSkill, SkillCatalog)
        .join(SkillCatalog, UserSkill.skill_id == SkillCatalog.id)
        .where(UserSkill.user_id == user_id)
        .order_by(UserSkill.proficiency.desc(), SkillCatalog.name.asc())
    )
    result = await db.execute(stmt)
    rows = result.all()

    return [
        UserSkillResponse(
            id=user_skill.id,
            skill_id=skill.id,
            name=skill.name,
            category=skill.category,
            proficiency=user_skill.proficiency,
            created_at=user_skill.created_at,
            updated_at=user_skill.updated_at,
        )
        for user_skill, skill in rows
    ]


async def add_skill(
    db: AsyncSession, user_id: uuid.UUID, data: AddSkillRequest
) -> UserSkillResponse:
    """
    Add a skill to the user's inventory.
    If the skill doesn't exist in the catalog, it is dynamically created under 'Other'.
    """
    clean_name = data.name.strip()
    if not clean_name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Skill name cannot be empty"
        )

    # Find or create in catalog (case-insensitive)
    catalog_stmt = select(SkillCatalog).where(func.lower(SkillCatalog.name) == clean_name.lower())
    catalog_skill = (await db.execute(catalog_stmt)).scalar_one_or_none()

    if not catalog_skill:
        catalog_skill = SkillCatalog(
            name=clean_name,
            category="Other",
            description=None,
        )
        db.add(catalog_skill)
        await db.flush()

    # Check for duplicate in user's inventory
    existing_stmt = select(UserSkill).where(
        UserSkill.user_id == user_id,
        UserSkill.skill_id == catalog_skill.id,
    )
    existing_user_skill = (await db.execute(existing_stmt)).scalar_one_or_none()
    if existing_user_skill:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Skill already exists in your inventory",
        )

    # Insert user skill
    new_user_skill = UserSkill(
        user_id=user_id,
        skill_id=catalog_skill.id,
        proficiency=data.proficiency,
    )
    db.add(new_user_skill)
    await db.commit()
    await db.refresh(new_user_skill)

    return UserSkillResponse(
        id=new_user_skill.id,
        skill_id=catalog_skill.id,
        name=catalog_skill.name,
        category=catalog_skill.category,
        proficiency=new_user_skill.proficiency,
        created_at=new_user_skill.created_at,
        updated_at=new_user_skill.updated_at,
    )


async def update_skill(
    db: AsyncSession, user_id: uuid.UUID, skill_id: uuid.UUID, data: UpdateSkillRequest
) -> UserSkillResponse:
    """Update proficiency of a skill in user's inventory."""
    # Lookup by UserSkill.id first
    stmt = (
        select(UserSkill, SkillCatalog)
        .join(SkillCatalog, UserSkill.skill_id == SkillCatalog.id)
        .where(UserSkill.id == skill_id)
    )
    result = (await db.execute(stmt)).first()

    # Fallback to UserSkill.skill_id for convenience
    if not result:
        stmt_fallback = (
            select(UserSkill, SkillCatalog)
            .join(SkillCatalog, UserSkill.skill_id == SkillCatalog.id)
            .where(UserSkill.skill_id == skill_id, UserSkill.user_id == user_id)
        )
        result = (await db.execute(stmt_fallback)).first()

    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Skill not found in inventory",
        )

    user_skill, skill = result
    if user_skill.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this skill",
        )

    user_skill.proficiency = data.proficiency
    await db.commit()
    await db.refresh(user_skill)

    return UserSkillResponse(
        id=user_skill.id,
        skill_id=skill.id,
        name=skill.name,
        category=skill.category,
        proficiency=user_skill.proficiency,
        created_at=user_skill.created_at,
        updated_at=user_skill.updated_at,
    )


async def delete_skill(db: AsyncSession, user_id: uuid.UUID, skill_id: uuid.UUID) -> None:
    """Delete a skill from user's inventory."""
    stmt = select(UserSkill).where(UserSkill.id == skill_id)
    user_skill = (await db.execute(stmt)).scalar_one_or_none()

    # Fallback to UserSkill.skill_id
    if not user_skill:
        stmt_fallback = select(UserSkill).where(
            UserSkill.skill_id == skill_id, UserSkill.user_id == user_id
        )
        user_skill = (await db.execute(stmt_fallback)).scalar_one_or_none()

    if not user_skill:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Skill not found in inventory",
        )

    if user_skill.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this skill",
        )

    await db.delete(user_skill)
    await db.commit()
