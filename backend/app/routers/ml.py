from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.ml import (
    GapAnalysisRequest,
    GapAnalysisResponse,
    RecommendationsResponse,
    ResourcesResponse,
)
from app.services import ml_service

router = APIRouter(prefix="/ml", tags=["ML"])


@router.get(
    "/roles",
    response_model=list[str],
    status_code=status.HTTP_200_OK,
    summary="Get available roles for gap analysis",
)
async def get_roles(
    current_user: User = Depends(get_current_user),
) -> list[str]:
    """Return all engineering career roles configured for gap analysis."""
    return await ml_service.get_roles_list()


@router.post(
    "/gap-analysis",
    response_model=GapAnalysisResponse,
    status_code=status.HTTP_200_OK,
    summary="Run skill gap analysis against a target role",
)
async def analyze_gaps(
    data: GapAnalysisRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> GapAnalysisResponse:
    """
    Run ML gap analysis comparing current user's skills with target role requirements.
    Persists analysis run in the database and returns identified gaps sorted by severity.
    """
    return await ml_service.run_gap_analysis(
        db=db,
        user_id=current_user.id,
        target_role=data.target_role,
    )


@router.get(
    "/recommendations",
    response_model=RecommendationsResponse,
    status_code=status.HTTP_200_OK,
    summary="Get prioritized skill recommendations based on latest gap analysis",
)
async def get_recommendations(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> RecommendationsResponse:
    """
    Generate prioritized skill recommendations based on the user's latest gap analysis.
    Ranks gaps using a weighted composite of gap urgency, market transferability,
    and synergy with already acquired skills.
    """
    return await ml_service.get_recommendations(
        db=db,
        user_id=current_user.id,
    )


@router.get(
    "/resources/{skill_name}",
    response_model=ResourcesResponse,
    status_code=status.HTTP_200_OK,
    summary="Get curated learning resources and courses for a specific skill",
)
async def get_skill_resources(
    skill_name: str,
    current_user: User = Depends(get_current_user),
) -> ResourcesResponse:
    """
    Retrieve curated courses, documentation, tutorials, videos, and books
    for a given skill. Features exact matching and TF-IDF fuzzy matching
    to accommodate typos and variations.
    """
    return await ml_service.get_resources(skill_name=skill_name)

