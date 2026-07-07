# Build from the repo root so the shared prompts/ directory is in context:
#   docker build -f speechy-server/.docker/Dockerfile -t speechy-server .
#
# Run web:    docker run -p 8000:8000 --env-file speechy-server/.env speechy-server
# Run worker: docker run --env-file speechy-server/.env speechy-server worker

FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    DJANGO_SETTINGS_MODULE=speechy.settings.production

WORKDIR /app

# libpq-dev required by psycopg2-binary
RUN apt-get update && apt-get install -y --no-install-recommends \
        libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY speechy-server/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Application code
COPY speechy-server/ .

# Prompts directory (mounted or baked in; PROMPTS_DIR env var can override)
COPY prompts/ /prompts/

RUN python manage.py collectstatic --noinput

COPY speechy-server/.docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 8000

ENTRYPOINT ["/entrypoint.sh"]
# Default: run the web server. Override with "worker" to run Celery.
CMD ["web"]
