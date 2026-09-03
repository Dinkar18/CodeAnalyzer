import pytest
from app.services.ingestion.app_type_detector import app_type_detector

def test_app_type_detection():
    detected_full_stack = app_type_detector.detect(".", ["Spring Boot", "React"])
    assert detected_full_stack == "FULL_STACK"

    detected_backend = app_type_detector.detect(".", ["FastAPI", "PostgreSQL"])
    assert detected_backend == "BACKEND_API"

    detected_frontend = app_type_detector.detect(".", ["React", "Tailwind CSS"])
    assert detected_frontend == "FRONTEND"
