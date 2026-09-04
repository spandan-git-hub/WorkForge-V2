import asyncio
import json
from datetime import datetime
from pathlib import Path
from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert

from app.db.base import AsyncSessionLocal
from app.models.skill import SkillCatalog
from app.models.event import Event


DATA_DIR = Path(__file__).resolve().parent.parent.parent / "data"


async def seed_skills(session) -> tuple[int, int]:
    skills_file = DATA_DIR / "skill_catalog.json"
    if not skills_file.exists():
        print(f"Warning: {skills_file} not found.")
        return 0, 0

    with open(skills_file, "r", encoding="utf-8") as f:
        skills_data = json.load(f)

    inserted = 0
    skipped = 0

    for item in skills_data:
        # Use ON CONFLICT (name) DO NOTHING
        stmt = (
            insert(SkillCatalog)
            .values(
                name=item["name"],
                category=item["category"],
                description=item.get("description"),
            )
            .on_conflict_do_nothing(index_elements=["name"])
        )
        res = await session.execute(stmt)
        if res.rowcount > 0:
            inserted += 1
        else:
            skipped += 1

    await session.commit()
    return inserted, skipped


async def seed_events(session) -> tuple[int, int]:
    events_file = DATA_DIR / "events_seed.json"
    if not events_file.exists():
        print(f"Warning: {events_file} not found.")
        return 0, 0

    with open(events_file, "r", encoding="utf-8") as f:
        events_data = json.load(f)

    inserted = 0
    skipped = 0

    for item in events_data:
        # Check if event with the same name already exists
        existing = await session.scalar(
            select(Event.id).where(Event.name == item["name"])
        )
        if existing:
            skipped += 1
            continue

        start_dt = datetime.fromisoformat(item["start_date"].replace("Z", "+00:00"))
        end_dt = (
            datetime.fromisoformat(item["end_date"].replace("Z", "+00:00"))
            if item.get("end_date")
            else None
        )

        event = Event(
            name=item["name"],
            description=item.get("description"),
            event_type=item["event_type"],
            start_date=start_dt,
            end_date=end_dt,
            location=item.get("location"),
            organizer=item.get("organizer"),
            skills=item.get("skills", []),
            url=item.get("url"),
        )
        session.add(event)
        inserted += 1

    await session.commit()
    return inserted, skipped


async def main():
    print("--- Starting WorkForge Database Seeding ---")
    async with AsyncSessionLocal() as session:
        skills_inserted, skills_skipped = await seed_skills(session)
        print(
            f"Skill Catalog: {skills_inserted} inserted, {skills_skipped} skipped (already exist)."
        )

        events_inserted, events_skipped = await seed_events(session)
        print(
            f"Events: {events_inserted} inserted, {events_skipped} skipped (already exist)."
        )
    print("--- Database Seeding Complete ---")


if __name__ == "__main__":
    asyncio.run(main())
