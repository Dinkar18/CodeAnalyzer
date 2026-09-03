import logging
from typing import List
from app.core.config import settings

logger = logging.getLogger(__name__)

class EmbeddingService:
    def __init__(self):
        self.provider = settings.EMBEDDING_PROVIDER.lower()
        self.dimension = settings.EMBEDDING_DIMENSION
        self._gemini_client = None

        if self.provider == "gemini" and settings.GEMINI_API_KEY and not settings.GEMINI_API_KEY.startswith("your_"):
            try:
                import google.generativeai as genai
                genai.configure(api_key=settings.GEMINI_API_KEY)
                self._gemini_client = genai
                logger.info("Configured Gemini Embedding Client with models/gemini-embedding-001.")
            except Exception as e:
                logger.warning(f"Failed to configure Gemini embeddings: {e}")

    async def generate_embedding(self, text: str) -> List[float]:
        """
        Generates a 768-dimensional float vector for the input text.
        """
        if self._gemini_client and self.provider == "gemini":
            try:
                result = self._gemini_client.embed_content(
                    model="models/gemini-embedding-001",
                    content=text
                )
                embedding = result.get('embedding', [])
                if len(embedding) == self.dimension:
                    return embedding
                elif len(embedding) > self.dimension:
                    # Normalized 768-dim slice
                    sub = embedding[:self.dimension]
                    norm = sum(x * x for x in sub) ** 0.5 or 1.0
                    return [x / norm for x in sub]
                else:
                    return embedding + [0.0] * (self.dimension - len(embedding))
            except Exception as e:
                logger.warning(f"Gemini embedding API call failed: {e}. Falling back to deterministic vector.")

        return self._generate_fallback_vector(text)

    async def generate_query_embedding(self, query: str) -> List[float]:
        return await self.generate_embedding(query)

    def _generate_fallback_vector(self, text: str) -> List[float]:
        import hashlib
        h = hashlib.sha256(text.encode('utf-8')).digest()
        vec = []
        for i in range(self.dimension):
            byte_val = h[i % len(h)]
            vec.append((byte_val / 255.0) - 0.5)
        norm = sum(x * x for x in vec) ** 0.5 or 1.0
        return [x / norm for x in vec]

embedding_service = EmbeddingService()
