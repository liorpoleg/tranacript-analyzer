from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    LoginView, LogoutView, MeView,
    OrganizationViewSet, UserViewSet,
    APIKeyViewSet, UserSessionViewSet, AuditLogViewSet,
)

router = DefaultRouter()
router.register('organizations', OrganizationViewSet, basename='organization')
router.register('users', UserViewSet, basename='user')
router.register('api-keys', APIKeyViewSet, basename='api-key')
router.register('sessions', UserSessionViewSet, basename='session')
router.register('audit-logs', AuditLogViewSet, basename='audit-log')

urlpatterns = [
    path('auth/login/', LoginView.as_view(), name='auth-login'),
    path('auth/logout/', LogoutView.as_view(), name='auth-logout'),
    path('auth/me/', MeView.as_view(), name='auth-me'),
    path('', include(router.urls)),
]
