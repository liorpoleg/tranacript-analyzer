from pathlib import Path
from .base import *  # noqa

DEBUG = True
CELERY_TASK_ALWAYS_EAGER = True
CELERY_TASK_EAGER_PROPAGATES = True

# Fast password hashing for tests
PASSWORD_HASHERS = ['django.contrib.auth.hashers.MD5PasswordHasher']

# Non-empty LLM endpoint so LLMClient initialises; real HTTP calls must be patched
LLM_ENDPOINT = 'http://test-llm.local/'
LLM_MODEL = 'test-model'
LLM_TIMEOUT = 10

# Resolve prompts dir explicitly so tests aren't broken by a blank PROMPTS_DIR in .env
PROMPTS_DIR = str(Path(__file__).resolve().parent.parent.parent.parent / 'prompts')
