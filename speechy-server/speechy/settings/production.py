from .base import *  # noqa
from decouple import config, Csv

DEBUG = False

SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'

JWT_COOKIE_SECURE = True
JWT_COOKIE_SAMESITE = 'Strict'
