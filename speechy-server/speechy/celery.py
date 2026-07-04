import os
from celery import Celery

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'speechy.settings.development')

app = Celery('speechy')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks() #defines that celery "takes" all the functions in files names tasks.py
