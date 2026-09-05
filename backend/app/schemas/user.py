import uuid
from datetime import datetime
from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

from app.ml.data_loader import get_available_roles


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

    @field_validator("target_role")
    @classmethod
    def validate_target_role(cls, v: str | None) -> str | None:
        if v is None:
            return None
        v_clean = v.strip()
        if not v_clean:
            return None
        available_roles = get_available_roles()
        for role in available_roles:
            if role.lower() == v_clean.lower():
                return role
        raise ValueError(
            f"Target role '{v_clean}' is not recognized. Must be one of: {', '.join(available_roles)}"
        )



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
