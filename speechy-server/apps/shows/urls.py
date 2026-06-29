from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ShowViewSet, SeasonViewSet

router = DefaultRouter()
router.register('shows', ShowViewSet, basename='show')
router.register('seasons', SeasonViewSet, basename='season')

urlpatterns = [path('', include(router.urls))]
