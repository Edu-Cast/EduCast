from tests.conftest import read_project_file


def test_docker_compose_contains_updated_runtime_services():
    compose = read_project_file("docker-compose.yml")

    for service in ["db:", "ollama:", "ml-service:", "backend:", "frontend:", "telegram-bot:"]:
        assert service in compose

    assert "postgres:15" in compose
    assert "ollama/ollama" in compose
    assert "image: ghcr.io/edu-cast/educast_frontend:latest" in compose
    assert "image: ghcr.io/edu-cast/educast_telegram_bot:latest" in compose
    assert "image: ghcr.io/edu-cast/educast-backend:latest" in compose
    assert "image: ghcr.io/edu-cast/educast_ml_service:latest" in compose

    assert "ML_SERVICE_URL: http://ml-service:8000" in compose
    assert "FILE_UPLOAD_DIR: /app/uploads" in compose
    assert "podcast_uploads:/app/uploads" in compose
    assert '"80:80"' in compose


def test_api_depends_on_database_and_ml_service_healthchecks():
    compose = read_project_file("docker-compose.yml")

    db_dependency = "db:\n        condition: service_healthy"
    ml_dependency = "ml-service:\n        condition: service_healthy"

    assert db_dependency in compose
    assert ml_dependency in compose
    assert "pg_isready -U ${SPRING_DATASOURCE_USERNAME} -d capstone" in compose
    assert "urllib.request.urlopen('http://localhost:8000/docs')" in compose


def test_frontend_nginx_serves_spa_and_proxies_api_to_backend_container():
    nginx = read_project_file("frontend/nginx.conf")

    assert "listen 80;" in nginx
    assert "proxy_pass http://backend:8080/api/;" in nginx
    assert "proxy_set_header Host $host;" in nginx
    assert "try_files $uri $uri/ /index.html;" in nginx


def test_dockerfiles_build_backend_and_frontend_from_project_sources():
    backend_dockerfile = read_project_file("backend/Dockerfile")
    frontend_dockerfile = read_project_file("frontend/Dockerfile")

    assert "FROM eclipse-temurin:21-jdk AS build" in backend_dockerfile
    assert "COPY mvnw pom.xml ./" in backend_dockerfile
    assert "COPY src ./src" in backend_dockerfile
    assert "./mvnw package -DskipTests" in backend_dockerfile
    assert "ENTRYPOINT" in backend_dockerfile

    assert "FROM node:22-alpine AS build" in frontend_dockerfile
    assert "RUN npm ci" in frontend_dockerfile
    assert "RUN npm run build" in frontend_dockerfile
    assert "FROM nginx:1.27-alpine" in frontend_dockerfile
    assert "COPY nginx.conf /etc/nginx/conf.d/default.conf" in frontend_dockerfile
