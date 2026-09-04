import uuid
from datetime import datetime
from pydantic import BaseModel, ConfigDict, EmailStr, Field


class ProfileResponse(BaseModel):
    id: uuid.UUID
    email: EmailStr
    name: str
    avatar_url: str | None = None
    bio: str | None = None
    target_role: str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ProfileUpdateRequest(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255, description="Full name")
    bio: str | None = Field(default=None, max_length=1000, description="Short bio or summary")
    avatar_url: str | None = Field(default=None, max_length=512, description="Avatar image URL")
    target_role: str | None = Field(default=None, max_length=255, description="Career target role")

    model_config = ConfigDict(from_attributes=True)


from app.schemas.event import EventListItem
from app.schemas.ml import GapItem


class DashboardUserInfo(BaseModel):
    name: str
    target_role: str | None = None


class DashboardResponse(BaseModel):
    user: DashboardUserInfo
    skill_count: int
    proficiency_distribution: dict[str, int]
    top_gaps: list[GapItem] | None = None
    upcoming_events: list[EventListItem] = Field(default_factory=list)
