from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProcessingJobViewSet

router = DefaultRouter()
router.register('jobs', ProcessingJobViewSet, basename='job')

urlpatterns = [path('', include(router.urls))]
