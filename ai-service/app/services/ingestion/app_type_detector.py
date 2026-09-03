import os
import logging
from typing import List

logger = logging.getLogger(__name__)

class AppTypeDetector:
    def detect(self, repo_dir: str, detected_techs: List[str]) -> str:
        has_backend = any(t in detected_techs for t in ('Spring Boot', 'FastAPI', 'Django', 'Flask', 'Express'))
        has_frontend = any(t in detected_techs for t in ('React', 'Vue.js', 'Next.js', 'Tailwind CSS'))
        has_ml = 'Machine Learning' in detected_techs
        
        # Check directory structure
        entries = set(os.listdir(repo_dir))
        has_multiple_modules = False
        if 'pom.xml' in entries or 'build.gradle' in entries:
            # Check for multiple module dirs
            subdirs = [d for d in entries if os.path.isdir(os.path.join(repo_dir, d)) and not d.startswith('.')]
            has_multiple_modules = len(subdirs) > 3

        if has_backend and has_frontend:
            return "FULL_STACK"
        elif has_backend and has_multiple_modules:
            return "MICROSERVICES"
        elif has_backend:
            return "BACKEND_API"
        elif has_frontend:
            return "FRONTEND"
        elif has_ml:
            return "MACHINE_LEARNING"
        elif 'CLI' in detected_techs:
            return "CLI"
        else:
            return "LIBRARY"

app_type_detector = AppTypeDetector()
