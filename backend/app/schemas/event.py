import uuid
from datetime import datetime
from typing import Literal
from pydantic import BaseModel, ConfigDict, Field


class EventListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    event_type: str
    start_date: datetime
    end_date: datetime | None = None
    location: str | None = None
    skills: list[str] = Field(default_factory=list)
    user_interest_status: Literal["interested", "registered", "attended"] | None = None


class EventDetail(EventListItem):
    description: str | None = None
    organizer: str | None = None
    url: str | None = None
    created_at: datetime


class EventsResponse(BaseModel):
    items: list[EventListItem]
    total: int
    page: int
    per_page: int
    pages: int


class EventInterestRequest(BaseModel):
    status: Literal["interested", "registered", "attended"]


class EventInterestResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    event_id: uuid.UUID
    status: str
    created_at: datetime
    updated_at: datetime
