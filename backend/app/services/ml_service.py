import uuid
from typing import Any
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.ml.data_loader import get_available_roles, load_role_requirements
from app.ml.gap_analyzer import gap_analyzer
from app.ml.recommender import recommender
from app.models.ml_analysis import MLAnalysis
from app.models.skill import SkillCatalog
from app.models.user_skill import UserSkill
from app.schemas.ml import (
    GapAnalysisResponse,
    GapItem,
    RecommendationItem,
    RecommendationsResponse,
)


async def get_roles_list() -> list[str]:
    """Return available career tracks/roles for gap analysis."""
    return get_available_roles()


async def run_gap_analysis(
    db: AsyncSession, user_id: uuid.UUID, target_role: str
) -> GapAnalysisResponse:
    """
    Run gap analysis for user against target_role, save the run in ml_analyses,
    and return the structured gap results.
    """
    target_role_clean = target_role.strip()
    available_roles = get_available_roles()

    # Case-insensitive role matching
    matched_role = None
    for role in available_roles:
        if role.lower() == target_role_clean.lower():
            matched_role = role
            break

    if not matched_role:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Target role '{target_role}' is not recognized. Please choose from available roles.",
        )

    # Fetch user skills joined with catalog
    stmt = (
        select(SkillCatalog.name, UserSkill.proficiency)
        .join(UserSkill, UserSkill.skill_id == SkillCatalog.id)
        .where(UserSkill.user_id == user_id)
    )
    result = await db.execute(stmt)
    user_skills: dict[str, int] = {row[0]: row[1] for row in result.all()}

    # Run ML gap analysis
    gaps_data: list[dict[str, Any]] = gap_analyzer.analyze(user_skills, matched_role)

    # Persist in ml_analyses table
    analysis = MLAnalysis(
        user_id=user_id,
        target_role=matched_role,
        gaps=gaps_data,
    )
    db.add(analysis)
    await db.commit()
    await db.refresh(analysis)

    return GapAnalysisResponse(
        target_role=analysis.target_role,
        gaps=[GapItem(**g) for g in gaps_data],
        ran_at=analysis.ran_at,
    )


async def get_recommendations(
    db: AsyncSession, user_id: uuid.UUID
) -> RecommendationsResponse:
    """
    Fetch user's most recent gap analysis, rank the identified gap skills
    using weighted market frequency and existing skill synergy, and return recommendations.
    """
    # 1. Fetch most recent analysis for user
    stmt = (
        select(MLAnalysis)
        .where(MLAnalysis.user_id == user_id)
        .order_by(MLAnalysis.ran_at.desc())
        .limit(1)
    )
    result = await db.execute(stmt)
    latest_analysis = result.scalars().first()

    if not latest_analysis:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Run gap analysis first. No previous analysis found.",
        )

    gaps = latest_analysis.gaps or []
    if not gaps:
        return RecommendationsResponse(recommendations=[])

    # 2. Fetch current user skills
    skills_stmt = (
        select(SkillCatalog.name, UserSkill.proficiency)
        .join(UserSkill, UserSkill.skill_id == SkillCatalog.id)
        .where(UserSkill.user_id == user_id)
    )
    skills_result = await db.execute(skills_stmt)
    user_skills: dict[str, int] = {row[0]: row[1] for row in skills_result.all()}

    # 3. Generate recommendations
    ranked_recommendations = recommender.recommend(
        user_skills=user_skills,
        gaps=gaps,
        top_n=8,
    )

    return RecommendationsResponse(
        recommendations=[RecommendationItem(**r) for r in ranked_recommendations]
    )

