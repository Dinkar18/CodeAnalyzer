import logging
import time
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import db
from app.core.redis_client import redis_manager
from app.api.routes import health, index, search, chat, analysis, graph

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger(__name__)

# Basic in-memory Prometheus metric counters
METRICS = {
    "http_requests_total": 0,
    "http_requests_2xx": 0,
    "http_requests_5xx": 0,
    "http_request_duration_seconds_sum": 0.0,
    "indexing_jobs_total": 0,
}

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting AI Codebase Architect AI Service...")
    await db.connect()
    await redis_manager.connect()
    yield
    logger.info("Shutting down AI Service...")
    await db.disconnect()
    await redis_manager.disconnect()

app = FastAPI(
    title=settings.APP_NAME,
    version="2.0.0",
    description="Intelligent repository parsing, Tree-sitter AST extraction, LangGraph agent workflows, and semantic code search.",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def metrics_middleware(request: Request, call_next):
    start_time = time.time()
    METRICS["http_requests_total"] += 1
    try:
        response = await call_next(request)
        if response.status_code < 400:
            METRICS["http_requests_2xx"] += 1
        elif response.status_code >= 500:
            METRICS["http_requests_5xx"] += 1
        return response
    except Exception:
        METRICS["http_requests_5xx"] += 1
        raise
    finally:
        duration = time.time() - start_time
        METRICS["http_request_duration_seconds_sum"] += duration

# Register routers
app.include_router(health.router, prefix="/api")
app.include_router(index.router, prefix="/api")
app.include_router(search.router, prefix="/api")
app.include_router(chat.router, prefix="/api")
app.include_router(analysis.router, prefix="/api")
app.include_router(graph.router, prefix="/api")

@app.get("/metrics")
async def prometheus_metrics():
    """Prometheus exposition format for metrics scraping."""
    avg_latency = (
        METRICS["http_request_duration_seconds_sum"] / max(1, METRICS["http_requests_total"])
    )
    lines = [
        "# HELP http_requests_total Total HTTP requests received",
        "# TYPE http_requests_total counter",
        f"http_requests_total {METRICS['http_requests_total']}",
        "# HELP http_requests_success_total Successful 2xx HTTP requests",
        "# TYPE http_requests_success_total counter",
        f"http_requests_success_total {METRICS['http_requests_2xx']}",
        "# HELP http_requests_error_total Failed 5xx HTTP requests",
        "# TYPE http_requests_error_total counter",
        f"http_requests_error_total {METRICS['http_requests_5xx']}",
        "# HELP http_request_duration_seconds_sum Total request latency in seconds",
        "# TYPE http_request_duration_seconds_sum gauge",
        f"http_request_duration_seconds_sum {METRICS['http_request_duration_seconds_sum']:.4f}",
        "# HELP http_request_latency_average Average request latency in seconds",
        "# TYPE http_request_latency_average gauge",
        f"http_request_latency_average {avg_latency:.4f}",
    ]
    return Response(content="\n".join(lines) + "\n", media_type="text/plain; version=0.0.4")

@app.get("/")
async def root():
    return {
        "service": settings.APP_NAME,
        "docs": "/docs",
        "metrics": "/metrics",
        "status": "OPERATIONAL"
    }
