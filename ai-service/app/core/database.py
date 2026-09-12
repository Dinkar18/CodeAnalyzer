import asyncpg
from pgvector.asyncpg import register_vector
import logging
from app.core.config import settings

logger = logging.getLogger(__name__)

class DatabasePool:
    def __init__(self):
        self.pool: asyncpg.Pool | None = None

    async def connect(self):
        try:
            dsn = settings.get_database_url()
            self.pool = await asyncpg.create_pool(
                dsn=dsn,
                min_size=2,
                max_size=20,
                init=self._init_connection
            )
            logger.info("PostgreSQL database connection pool established.")
        except Exception as e:
            logger.error(f"Failed to connect to database at {settings.get_database_url()}: {e}")
            self.pool = None

    async def _init_connection(self, conn: asyncpg.Connection):
        try:
            await conn.execute("CREATE EXTENSION IF NOT EXISTS vector;")
            await register_vector(conn)
        except Exception as e:
            logger.warning(f"Could not initialize pgvector extension: {e}")

    async def disconnect(self):
        if self.pool:
            await self.pool.close()
            logger.info("PostgreSQL database connection pool closed.")

    async def get_connection(self) -> asyncpg.Connection:
        if not self.pool:
            await self.connect()
        if not self.pool:
            raise RuntimeError("Database pool not initialized. Unable to connect to PostgreSQL.")
        return await self.pool.acquire()

    async def release_connection(self, conn: asyncpg.Connection):
        if self.pool:
            await self.pool.release(conn)

db = DatabasePool()
