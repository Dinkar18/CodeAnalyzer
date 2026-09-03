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
            self.pool = await asyncpg.create_pool(
                host=settings.POSTGRES_HOST,
                port=settings.POSTGRES_PORT,
                user=settings.POSTGRES_USER,
                password=settings.POSTGRES_PASSWORD,
                database=settings.POSTGRES_DB,
                min_size=2,
                max_size=20,
                init=self._init_connection
            )
            logger.info("PostgreSQL database connection pool established.")
        except Exception as e:
            logger.error(f"Failed to connect to database: {e}")
            raise e

    async def _init_connection(self, conn: asyncpg.Connection):
        await register_vector(conn)

    async def disconnect(self):
        if self.pool:
            await self.pool.close()
            logger.info("PostgreSQL database connection pool closed.")

    async def get_connection(self) -> asyncpg.Connection:
        if not self.pool:
            raise RuntimeError("Database pool not initialized. Call connect() first.")
        return await self.pool.acquire()

    async def release_connection(self, conn: asyncpg.Connection):
        if self.pool:
            await self.pool.release(conn)

db = DatabasePool()
