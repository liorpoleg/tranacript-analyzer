from django.conf import settings
from django.utils import timezone
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError

from .models import Organization, User, APIKey, UserSession, AuditLog
from .serializers import (
    OrganizationSerializer, UserSerializer, UserCreateSerializer,
    APIKeySerializer, APIKeyCreateSerializer, UserSessionSerializer,
    AuditLogSerializer, LoginSerializer,
)
from .services import login_user, create_session, revoke_session, create_api_key, revoke_api_key


def _set_auth_cookies(response, refresh):
    access_cookie = getattr(settings, 'JWT_COOKIE_NAME', 'speechy_access')
    refresh_cookie = getattr(settings, 'JWT_REFRESH_COOKIE_NAME', 'speechy_refresh')
    httponly = getattr(settings, 'JWT_COOKIE_HTTPONLY', True)
    samesite = getattr(settings, 'JWT_COOKIE_SAMESITE', 'Lax')
    secure = getattr(settings, 'JWT_COOKIE_SECURE', False)
    access_lifetime = settings.SIMPLE_JWT['ACCESS_TOKEN_LIFETIME']
    refresh_lifetime = settings.SIMPLE_JWT['REFRESH_TOKEN_LIFETIME']

    response.set_cookie(
        access_cookie, str(refresh.access_token),
        max_age=int(access_lifetime.total_seconds()),
        httponly=httponly, samesite=samesite, secure=secure,
    )
    response.set_cookie(
        refresh_cookie, str(refresh),
        max_age=int(refresh_lifetime.total_seconds()),
        httponly=httponly, samesite=samesite, secure=secure,
    )


class LoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user, refresh = login_user(
            serializer.validated_data['username'],
            serializer.validated_data['password'],
        )
        if user is None:
            return Response(
                {'data': None, 'error': {'code': 401, 'message': 'Invalid credentials.'}},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        ip = request.META.get('REMOTE_ADDR')
        ua = request.META.get('HTTP_USER_AGENT', '')
        create_session(user, refresh, ip, ua)
        response = Response({'data': UserSerializer(user).data, 'error': None})
        _set_auth_cookies(response, refresh)
        return response


class LogoutView(APIView):
    def post(self, request):
        refresh_cookie = getattr(settings, 'JWT_REFRESH_COOKIE_NAME', 'speechy_refresh')
        raw_refresh = request.COOKIES.get(refresh_cookie)
        if raw_refresh:
            try:
                token = RefreshToken(raw_refresh)
                jti = str(token['jti'])
                UserSession.objects.filter(refresh_token_jti=jti).update(is_active=False)
                token.blacklist()
            except TokenError:
                pass
        response = Response({'data': None, 'error': None})
        response.delete_cookie(getattr(settings, 'JWT_COOKIE_NAME', 'speechy_access'))
        response.delete_cookie(refresh_cookie)
        return response


class MeView(APIView):
    def get(self, request):
        return Response({'data': UserSerializer(request.user).data, 'error': None})


class OrganizationViewSet(viewsets.ModelViewSet):
    queryset = Organization.objects.all()
    serializer_class = OrganizationSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return Organization.objects.all()
        return Organization.objects.filter(id=user.organization_id)

    def list(self, request, *args, **kwargs):
        qs = self.get_queryset()
        return Response({'data': OrganizationSerializer(qs, many=True).data, 'error': None})

    def retrieve(self, request, *args, **kwargs):
        return Response({'data': OrganizationSerializer(self.get_object()).data, 'error': None})

    def create(self, request, *args, **kwargs):
        s = OrganizationSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        org = s.save()
        return Response({'data': OrganizationSerializer(org).data, 'error': None},
                        status=status.HTTP_201_CREATED)

    def partial_update(self, request, *args, **kwargs):
        s = OrganizationSerializer(self.get_object(), data=request.data, partial=True)
        s.is_valid(raise_exception=True)
        org = s.save()
        return Response({'data': OrganizationSerializer(org).data, 'error': None})


class UserViewSet(viewsets.ModelViewSet):
    serializer_class = UserSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return User.objects.select_related('organization').all()
        return User.objects.filter(organization=user.organization).select_related('organization')

    def list(self, request, *args, **kwargs):
        qs = self.filter_queryset(self.get_queryset())
        return Response({'data': UserSerializer(qs, many=True).data, 'error': None})

    def retrieve(self, request, *args, **kwargs):
        return Response({'data': UserSerializer(self.get_object()).data, 'error': None})

    def create(self, request, *args, **kwargs):
        s = UserCreateSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        user = s.save()
        return Response({'data': UserSerializer(user).data, 'error': None},
                        status=status.HTTP_201_CREATED)

    def partial_update(self, request, *args, **kwargs):
        s = UserSerializer(self.get_object(), data=request.data, partial=True)
        s.is_valid(raise_exception=True)
        user = s.save()
        return Response({'data': UserSerializer(user).data, 'error': None})


class APIKeyViewSet(viewsets.GenericViewSet):
    serializer_class = APIKeySerializer

    def get_queryset(self):
        return APIKey.objects.filter(user=self.request.user)

    def list(self, request):
        qs = self.get_queryset()
        return Response({'data': APIKeySerializer(qs, many=True).data, 'error': None})

    def create(self, request):
        s = APIKeyCreateSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        api_key, raw = create_api_key(request.user, s.validated_data['name'])
        data = APIKeySerializer(api_key).data
        data['key'] = raw  # shown once
        return Response({'data': data, 'error': None}, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def revoke(self, request, pk=None):
        api_key = self.get_queryset().get(pk=pk)
        revoke_api_key(api_key)
        return Response({'data': APIKeySerializer(api_key).data, 'error': None})


class UserSessionViewSet(viewsets.GenericViewSet):
    serializer_class = UserSessionSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return UserSession.objects.select_related('user').filter(is_active=True)
        return UserSession.objects.filter(user=user, is_active=True)

    def list(self, request):
        qs = self.get_queryset()
        return Response({'data': UserSessionSerializer(qs, many=True).data, 'error': None})

    @action(detail=True, methods=['post'])
    def revoke(self, request, pk=None):
        session = self.get_queryset().get(pk=pk)
        revoke_session(session)
        return Response({'data': UserSessionSerializer(session).data, 'error': None})


class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = AuditLogSerializer

    def get_queryset(self):
        user = self.request.user
        qs = AuditLog.objects.select_related('user')
        if user.role != 'admin':
            qs = qs.filter(organization=user.organization)
        action_filter = self.request.query_params.get('action')
        if action_filter:
            qs = qs.filter(action__icontains=action_filter)
        return qs

    def list(self, request, *args, **kwargs):
        qs = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(qs)
        if page is not None:
            return self.get_paginated_response(AuditLogSerializer(page, many=True).data)
        return Response({'data': AuditLogSerializer(qs, many=True).data, 'error': None})

    def retrieve(self, request, *args, **kwargs):
        return Response({'data': AuditLogSerializer(self.get_object()).data, 'error': None})
