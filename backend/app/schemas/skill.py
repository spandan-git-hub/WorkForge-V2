import uuid
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class SkillCatalogItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    category: str
    description: str | None = None


class UserSkillResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    skill_id: uuid.UUID
    name: str
    category: str
    proficiency: int = Field(..., ge=1, le=5)
    created_at: datetime
    updated_at: datetime | None = None


class AddSkillRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    proficiency: int = Field(..., ge=1, le=5)


class UpdateSkillRequest(BaseModel):
    proficiency: int = Field(..., ge=1, le=5)
