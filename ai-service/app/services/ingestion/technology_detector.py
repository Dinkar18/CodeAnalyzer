import os
import json
import logging
from typing import List, Set

logger = logging.getLogger(__name__)

class TechnologyDetector:
    def detect(self, repo_dir: str) -> List[str]:
        technologies: Set[str] = set()

        for root, dirs, files in os.walk(repo_dir):
            # Exclude hidden or build directories
            dirs[:] = [d for d in dirs if not d.startswith('.') and d not in {'node_modules', 'target', 'build', 'dist', '__pycache__', 'venv', '.venv'}]

            for file in files:
                file_lower = file.lower()
                full_path = os.path.join(root, file)

                # Java / JVM
                if file_lower == 'pom.xml':
                    technologies.add('Java')
                    technologies.add('Maven')
                    self._inspect_pom(full_path, technologies)
                elif file_lower in ('build.gradle', 'build.gradle.kts'):
                    technologies.add('Java')
                    technologies.add('Gradle')
                
                # Python
                elif file_lower in ('requirements.txt', 'pyproject.toml', 'pipfile', 'setup.py'):
                    technologies.add('Python')
                    self._inspect_python_deps(full_path, technologies)

                # JavaScript / TypeScript / Frontend
                elif file_lower == 'package.json':
                    self._inspect_package_json(full_path, technologies)

                # Containers & Infrastructure
                elif 'dockerfile' in file_lower:
                    technologies.add('Docker')
                elif file_lower in ('docker-compose.yml', 'docker-compose.yaml', 'compose.yaml'):
                    technologies.add('Docker Compose')
                    self._inspect_docker_compose(full_path, technologies)

                # Config files
                elif file_lower in ('application.yml', 'application.yaml', 'application.properties'):
                    technologies.add('Spring Boot')
                    self._inspect_spring_properties(full_path, technologies)

        return sorted(list(technologies))

    def _inspect_pom(self, path: str, techs: Set[str]):
        try:
            with open(path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read().lower()
                if 'spring-boot' in content:
                    techs.add('Spring Boot')
                if 'postgresql' in content or 'r2dbc-postgresql' in content:
                    techs.add('PostgreSQL')
                if 'mysql' in content:
                    techs.add('MySQL')
                if 'redis' in content:
                    techs.add('Redis')
                if 'kafka' in content:
                    techs.add('Apache Kafka')
                if 'flyway' in content:
                    techs.add('Flyway')
                if 'liquibase' in content:
                    techs.add('Liquibase')
        except Exception as e:
            logger.warning(f"Error inspecting pom.xml at {path}: {e}")

    def _inspect_package_json(self, path: str, techs: Set[str]):
        try:
            with open(path, 'r', encoding='utf-8', errors='ignore') as f:
                data = json.load(f)
                deps = {**data.get('dependencies', {}), **data.get('devDependencies', {})}
                techs.add('Node.js')
                if 'typescript' in deps:
                    techs.add('TypeScript')
                else:
                    techs.add('JavaScript')
                if 'react' in deps:
                    techs.add('React')
                if 'vue' in deps:
                    techs.add('Vue.js')
                if 'next' in deps:
                    techs.add('Next.js')
                if 'express' in deps:
                    techs.add('Express')
                if 'tailwindcss' in deps:
                    techs.add('Tailwind CSS')
        except Exception as e:
            logger.warning(f"Error inspecting package.json at {path}: {e}")

    def _inspect_python_deps(self, path: str, techs: Set[str]):
        try:
            with open(path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read().lower()
                if 'fastapi' in content:
                    techs.add('FastAPI')
                if 'django' in content:
                    techs.add('Django')
                if 'flask' in content:
                    techs.add('Flask')
                if 'langgraph' in content or 'langchain' in content:
                    techs.add('LangGraph')
                if 'torch' in content or 'tensorflow' in content:
                    techs.add('Machine Learning')
        except Exception as e:
            logger.warning(f"Error inspecting python deps at {path}: {e}")

    def _inspect_docker_compose(self, path: str, techs: Set[str]):
        try:
            with open(path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read().lower()
                if 'postgres' in content or 'pgvector' in content:
                    techs.add('PostgreSQL')
                if 'redis' in content:
                    techs.add('Redis')
                if 'kafka' in content:
                    techs.add('Apache Kafka')
                if 'elasticsearch' in content:
                    techs.add('Elasticsearch')
        except Exception as e:
            logger.warning(f"Error inspecting docker-compose at {path}: {e}")

    def _inspect_spring_properties(self, path: str, techs: Set[str]):
        try:
            with open(path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read().lower()
                if 'postgresql' in content:
                    techs.add('PostgreSQL')
                if 'redis' in content:
                    techs.add('Redis')
                if 'kafka' in content:
                    techs.add('Apache Kafka')
        except Exception as e:
            logger.warning(f"Error inspecting spring properties at {path}: {e}")

technology_detector = TechnologyDetector()
