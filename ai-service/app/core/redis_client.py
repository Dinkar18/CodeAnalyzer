import redis.asyncio as redis
import logging
from app.core.config import settings

logger = logging.getLogger(__name__)

class RedisManager:
    def __init__(self):
        self.client: redis.Redis | None = None

    async def connect(self):
        try:
            self.client = redis.Redis(
                host=settings.REDIS_HOST,
                port=settings.REDIS_PORT,
                db=settings.REDIS_DB,
                decode_responses=True
            )
            await self.client.ping()
            logger.info("Redis connection established.")
        except Exception as e:
            logger.warning(f"Failed to connect to Redis: {e}. Caching disabled or running in fallback mode.")
            self.client = None

    async def disconnect(self):
        if self.client:
            await self.client.close()
            logger.info("Redis connection closed.")

    async def set_job_status(self, job_id: str, status_data: dict, expire_seconds: int = 86400):
        if not self.client:
            return
        import json
        await self.client.setex(f"job:{job_id}", expire_seconds, json.dumps(status_data))

    async def get_job_status(self, job_id: str) -> dict | None:
        if not self.client:
            return None
        import json
        data = await self.client.get(f"job:{job_id}")
        return json.loads(data) if data else None

redis_manager = RedisManager()
