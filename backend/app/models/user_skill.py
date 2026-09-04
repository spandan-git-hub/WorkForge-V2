import uuid
from datetime import datetime
from sqlalchemy import ForeignKey, SmallInteger, DateTime, func, CheckConstraint, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class UserSkill(Base):
    __tablename__ = "user_skills"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    skill_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("skill_catalog.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    proficiency: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    __table_args__ = (
        CheckConstraint("proficiency >= 1 AND proficiency <= 5", name="check_proficiency_range"),
        UniqueConstraint("user_id", "skill_id", name="uq_user_skill"),
    )

    # Relationships
    user = relationship("User", back_populates="skills")
    skill = relationship("SkillCatalog", back_populates="user_skills")
