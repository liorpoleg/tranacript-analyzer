#!/bin/sh
set -e

case "$1" in
  web)
    echo "Running migrations…"
    python manage.py migrate --noinput
    echo "Starting gunicorn…"
    exec gunicorn speechy.wsgi:application \
      --bind 0.0.0.0:8000 \
      --workers 2 \
      --threads 4 \
      --timeout 120 \
      --access-logfile - \
      --error-logfile -
    ;;
  worker)
    echo "Starting Celery worker…"
    exec celery -A speechy worker --loglevel=info
    ;;
  *)
    exec "$@"
    ;;
esac
