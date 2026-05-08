import asyncio
import sys
import os

# Get absolute path to backend
backend_path = os.path.abspath(os.path.join(os.getcwd(), 'backend'))
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

os.chdir(backend_path)

from app.database_config import engine
from app.models.family_member_model import FamilyMember
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import sessionmaker

async def check():
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with async_session() as session:
        result = await session.execute(select(FamilyMember))
        members = result.scalars().all()
        print(f"Total family members in DB: {len(members)}")
        for m in members:
            print(f" - User: {m.user_id} | Patient: {m.patient_id} | Relation: {m.relation}")

if __name__ == "__main__":
    asyncio.run(check())
