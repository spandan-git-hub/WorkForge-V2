from datetime import datetime
from typing import Literal, Optional
from pydantic import BaseModel, Field


class GapAnalysisRequest(BaseModel):
    target_role: str = Field(..., min_length=1, max_length=255, description="Target job role to analyze against")


class GapItem(BaseModel):
    skill: str
    current: int = Field(..., ge=0, le=5)
    required: int = Field(..., ge=1, le=5)
    gap_magnitude: int = Field(..., ge=1, le=5)
    severity: Literal["High", "Medium", "Low"]


class GapAnalysisResponse(BaseModel):
    target_role: str
    gaps: list[GapItem]
    ran_at: datetime


# Placeholder schemas for Phase 8 & Phase 9
class RecommendationItem(BaseModel):
    skill: str
    priority: int
    reason: str
    score: Optional[float] = None


class RecommendationsResponse(BaseModel):
    recommendations: list[RecommendationItem]


class ResourceItem(BaseModel):
    title: str
    type: str
    platform: str
    url: str
    duration: Optional[str] = None


class ResourcesResponse(BaseModel):
    skill: str
    resources: list[ResourceItem]
