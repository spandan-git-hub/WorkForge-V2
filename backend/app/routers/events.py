import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.event import (
    EventDetail,
    EventInterestRequest,
    EventInterestResponse,
    EventsResponse,
)
from app.services import event_service

router = APIRouter(prefix="/events", tags=["Events"])


@router.get(
    "",
    response_model=EventsResponse,
    status_code=status.HTTP_200_OK,
    summary="List and filter events",
)
async def list_events(
    type: list[str] | None = Query(
        default=None,
        description="Filter by event type (conference, hackathon, workshop, meetup)",
    ),
    date_from: datetime | None = Query(
        default=None,
        description="Filter events starting on or after this ISO date/datetime",
    ),
    date_to: datetime | None = Query(
        default=None,
        description="Filter events starting on or before this ISO date/datetime",
    ),
    location: str | None = Query(
        default=None,
        description="Filter events by partial location match",
    ),
    skill: str | None = Query(
        default=None,
        description="Filter events that include this skill tag",
    ),
    page: int = Query(default=1, ge=1, description="Page number"),
    per_page: int = Query(default=12, ge=1, le=100, description="Items per page"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> EventsResponse:
    """Retrieve paginated events with optional filters and user interest status."""
    flattened_types = None
    if type:
        flattened_types = []
        for item in type:
            for piece in item.split(","):
                clean = piece.strip()
                if clean:
                    flattened_types.append(clean)

    return await event_service.get_events(
        db=db,
        user_id=current_user.id,
        event_types=flattened_types,
        date_from=date_from,
        date_to=date_to,
        location=location,
        skill=skill,
        page=page,
        per_page=per_page,
    )


@router.get(
    "/{event_id}",
    response_model=EventDetail,
    status_code=status.HTTP_200_OK,
    summary="Get single event details",
)
async def get_event(
    event_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> EventDetail:
    """Retrieve full details of a specific event including user's interest status."""
    return await event_service.get_event_by_id(
        db=db,
        event_id=event_id,
        user_id=current_user.id,
    )


@router.post(
    "/{event_id}/interest",
    response_model=EventInterestResponse,
    status_code=status.HTTP_200_OK,
    summary="Set interest status for an event",
)
async def set_event_interest(
    event_id: uuid.UUID,
    payload: EventInterestRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> EventInterestResponse:
    """Track or update user's interest in an event (interested, registered, attended)."""
    interest = await event_service.set_interest(
        db=db,
        user_id=current_user.id,
        event_id=event_id,
        new_status=payload.status,
    )
    return EventInterestResponse.model_validate(interest)


@router.delete(
    "/{event_id}/interest",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Remove interest from an event",
)
async def remove_event_interest(
    event_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Response:
    """Remove user's interest tracking record for an event."""
    await event_service.remove_interest(
        db=db,
        user_id=current_user.id,
        event_id=event_id,
    )
    return Response(status_code=status.HTTP_204_NO_CONTENT)
