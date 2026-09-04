import math
import uuid
from datetime import datetime
from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.event import Event
from app.models.event_interest import EventInterest
from app.schemas.event import EventDetail, EventListItem, EventsResponse


async def get_events(
    db: AsyncSession,
    user_id: uuid.UUID,
    event_types: list[str] | None = None,
    date_from: datetime | None = None,
    date_to: datetime | None = None,
    location: str | None = None,
    skill: str | None = None,
    page: int = 1,
    per_page: int = 12,
) -> EventsResponse:
    """Fetch paginated events with filters and current user's interest status."""
    page = max(1, page)
    per_page = max(1, min(per_page, 100))

    filters = []

    if event_types:
        # Clean and lower-case types
        cleaned_types = [t.strip().lower() for t in event_types if t.strip()]
        if cleaned_types:
            filters.append(func.lower(Event.event_type).in_(cleaned_types))

    if date_from is not None:
        filters.append(Event.start_date >= date_from)

    if date_to is not None:
        filters.append(Event.start_date <= date_to)

    if location and location.strip():
        filters.append(Event.location.ilike(f"%{location.strip()}%"))

    if skill and skill.strip():
        # Match skill against PostgreSQL ARRAY using string conversion for partial & case-insensitive matching
        clean_skill = skill.strip()
        filters.append(func.array_to_string(Event.skills, ",").ilike(f"%{clean_skill}%"))

    # Total count query
    count_stmt = select(func.count(Event.id))
    if filters:
        count_stmt = count_stmt.where(*filters)
    total = (await db.execute(count_stmt)).scalar() or 0

    # Paginated events query with left join on user's interests
    query_stmt = (
        select(Event, EventInterest.status.label("user_interest_status"))
        .outerjoin(
            EventInterest,
            (EventInterest.event_id == Event.id) & (EventInterest.user_id == user_id),
        )
    )
    if filters:
        query_stmt = query_stmt.where(*filters)

    query_stmt = (
        query_stmt.order_by(Event.start_date.asc(), Event.name.asc())
        .offset((page - 1) * per_page)
        .limit(per_page)
    )

    results = (await db.execute(query_stmt)).all()

    items = [
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
        for row in results
    ]

    pages = math.ceil(total / per_page) if total > 0 else 1

    return EventsResponse(
        items=items,
        total=total,
        page=page,
        per_page=per_page,
        pages=pages,
    )


async def get_event_by_id(
    db: AsyncSession,
    event_id: uuid.UUID,
    user_id: uuid.UUID,
) -> EventDetail:
    """Fetch single event details with user's interest status."""
    stmt = (
        select(Event, EventInterest.status.label("user_interest_status"))
        .outerjoin(
            EventInterest,
            (EventInterest.event_id == Event.id) & (EventInterest.user_id == user_id),
        )
        .where(Event.id == event_id)
    )

    result = (await db.execute(stmt)).first()
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found",
        )

    event, user_interest_status = result
    return EventDetail(
        id=event.id,
        name=event.name,
        description=event.description,
        event_type=event.event_type,
        start_date=event.start_date,
        end_date=event.end_date,
        location=event.location,
        organizer=event.organizer,
        skills=event.skills or [],
        url=event.url,
        created_at=event.created_at,
        user_interest_status=user_interest_status,
    )


async def set_interest(
    db: AsyncSession,
    user_id: uuid.UUID,
    event_id: uuid.UUID,
    new_status: str,
) -> EventInterest:
    """Create or update user's interest in an event."""
    event = await db.scalar(select(Event).where(Event.id == event_id))
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found",
        )

    stmt = select(EventInterest).where(
        EventInterest.user_id == user_id,
        EventInterest.event_id == event_id,
    )
    interest = await db.scalar(stmt)

    if interest:
        interest.status = new_status
    else:
        interest = EventInterest(
            user_id=user_id,
            event_id=event_id,
            status=new_status,
        )
        db.add(interest)

    await db.commit()
    await db.refresh(interest)
    return interest


async def remove_interest(
    db: AsyncSession,
    user_id: uuid.UUID,
    event_id: uuid.UUID,
) -> None:
    """Remove user's interest record for an event."""
    stmt = select(EventInterest).where(
        EventInterest.user_id == user_id,
        EventInterest.event_id == event_id,
    )
    interest = await db.scalar(stmt)

    if not interest:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Interest record not found for this event",
        )

    await db.delete(interest)
    await db.commit()
