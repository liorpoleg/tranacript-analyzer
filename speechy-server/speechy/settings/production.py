from .base import *  # noqa
from decouple import config, Csv

DEBUG = False

SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'

JWT_COOKIE_SECURE = True
JWT_COOKIE_SAMESITE = 'Strict'

# WhiteNoise — serve Django admin static files without a separate web server
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
] + MIDDLEWARE[1:]  # type: ignore[name-defined]  # noqa: F405

STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'
