import uuid
from datetime import datetime, timezone
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.event import Event
from app.models.event_interest import EventInterest
from app.models.ml_analysis import MLAnalysis
from app.models.user import User
from app.models.user_skill import UserSkill
from app.schemas.event import EventListItem
from app.schemas.ml import GapItem
from app.schemas.user import (
    DashboardResponse,
    DashboardUserInfo,
    ProfileResponse,
    ProfileUpdateRequest,
)


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
 

async def get_dashboard_data(db: AsyncSession, user_id: uuid.UUID) -> DashboardResponse:
    """
    Fetch comprehensive dashboard overview for user:
    - User details (name, target_role)
    - Skill count & proficiency distribution (1-5)
    - Top 3 skill gaps from latest ML analysis (or None)
    - Next 3 upcoming events user has expressed interest in (or [])
    """
    # 1. Fetch user
    user_res = await db.execute(select(User).where(User.id == user_id))
    user = user_res.scalar_one_or_none()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    # 2. Skill count and proficiency distribution
    skills_stmt = select(UserSkill.proficiency).where(UserSkill.user_id == user_id)
    skills_res = await db.execute(skills_stmt)
    proficiencies = skills_res.scalars().all()
    skill_count = len(proficiencies)

    proficiency_distribution = {str(i): 0 for i in range(1, 6)}
    for p in proficiencies:
        p_str = str(p)
        if p_str in proficiency_distribution:
            proficiency_distribution[p_str] += 1

    # 3. Top gaps from latest ml_analyses
    ml_stmt = (
        select(MLAnalysis)
        .where(MLAnalysis.user_id == user_id)
        .order_by(MLAnalysis.ran_at.desc())
        .limit(1)
    )
    ml_res = await db.execute(ml_stmt)
    latest_ml = ml_res.scalars().first()

    top_gaps = None
    if latest_ml is not None:
        gaps_list = latest_ml.gaps or []
        top_gaps = [GapItem(**g) for g in gaps_list[:3]]

    # 4. Upcoming events user has interest on
    now = datetime.now(timezone.utc)
    upcoming_stmt = (
        select(Event, EventInterest.status)
        .join(EventInterest, (EventInterest.event_id == Event.id) & (EventInterest.user_id == user_id))
        .where(Event.start_date >= now)
        .order_by(Event.start_date.asc())
        .limit(3)
    )
    events_rows = (await db.execute(upcoming_stmt)).all()

    # If fewer than 3 future events, supplement with recent past interested events
    if len(events_rows) < 3:
        existing_ids = [row[0].id for row in events_rows]
        fallback_stmt = (
            select(Event, EventInterest.status)
            .join(EventInterest, (EventInterest.event_id == Event.id) & (EventInterest.user_id == user_id))
            .order_by(Event.start_date.desc())
            .limit(3)
        )
        if existing_ids:
            fallback_stmt = fallback_stmt.where(Event.id.not_in(existing_ids))
        fallback_rows = (await db.execute(fallback_stmt)).all()
        events_rows = list(events_rows) + list(fallback_rows)[: (3 - len(events_rows))]

    upcoming_events = [
        EventListItem(
            id=row[0].id,
            name=row[0].name,
            event_type=row[0].event_type,
            start_date=row[0].start_date,
            end_date=row[0].end_date,
            location=row[0].location,
            skills=row[0].skills or [],
            user_interest_status=row[1],
        )
        for row in events_rows
    ]

    return DashboardResponse(
        user=DashboardUserInfo(
            name=user.name,
            target_role=user.target_role,
        ),
        skill_count=skill_count,
        proficiency_distribution=proficiency_distribution,
        top_gaps=top_gaps,
        upcoming_events=upcoming_events,
    )
