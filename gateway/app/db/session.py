#SQLAlchemy engine + get_db dependency
from pathlib import Path
from sqlalchemy import text
from sqlalchemy.ext.asyncio import (
    create_async_engine,
    AsyncSession,
    async_sessionmaker,
)
from app.config import settings

engine = create_async_engine(settings.database_url, echo=False)

AsyncSessionLocal = async_sessionmaker(
    engine,
    expire_on_commit=False,
)

async def init_db():
    """
    Reads schema.sql and runs it against the database.
    Safe to call every time — all statements use IF NOT EXISTS.
    """
    schema_path = Path(__file__).parent / "schema.sql"
    sql = schema_path.read_text()

    async with engine.begin() as conn:
        for statement in sql.split(";"):
            statement = statement.strip()
            if statement:
                await conn.execute(text(statement))

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session