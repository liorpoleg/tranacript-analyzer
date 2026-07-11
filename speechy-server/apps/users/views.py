from datetime import timedelta

from django.conf import settings as django_settings
from django.shortcuts import redirect
from django.views import View
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Organization, User, APIKey, UserSession, AuditLog
from .serializers import (
    OrganizationSerializer, UserSerializer, UserCreateSerializer,
    APIKeySerializer, APIKeyCreateSerializer, UserSessionSerializer,
    AuditLogSerializer, LoginSerializer, RegisterSerializer,
    SpeechyTokenObtainPairSerializer,
)
from .services import login_user, register_user, create_session, revoke_session, create_api_key, revoke_api_key


class LoginView(APIView):
    authentication_classes = []
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user, _ = login_user(
            serializer.validated_data['username'],
            serializer.validated_data['password'],
        )
        if user is None:
            return Response(
                {'data': None, 'error': {'code': 401, 'message': 'Invalid credentials.'}},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        refresh = SpeechyTokenObtainPairSerializer.get_token(user)
        ip = request.META.get('REMOTE_ADDR')
        ua = request.META.get('HTTP_USER_AGENT', '')
        create_session(user, refresh, ip, ua)
        return Response({'data': {'token': str(refresh.access_token), 'user': UserSerializer(user).data}, 'error': None})


class RegisterView(APIView):
    authentication_classes = []
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        d = serializer.validated_data
        user, _ = register_user(
            username=d['username'],
            email=d['email'],
            password=d['password'],
            organization_name=d['organization_name'],
        )
        refresh = SpeechyTokenObtainPairSerializer.get_token(user)
        ip = request.META.get('REMOTE_ADDR')
        ua = request.META.get('HTTP_USER_AGENT', '')
        create_session(user, refresh, ip, ua)
        return Response(
            {'data': {'token': str(refresh.access_token), 'user': UserSerializer(user).data}, 'error': None},
            status=status.HTTP_201_CREATED,
        )


class LogoutView(APIView):
    def post(self, request):
        return Response({'data': None, 'error': None})


class MeView(APIView):
    def get(self, request):
        return Response({'data': UserSerializer(request.user).data, 'error': None})


class MockSSOView(View):
    def get(self, request):
        org, _ = Organization.objects.get_or_create(
            slug='sso-org',
            defaults={'name': 'SSO Organization', 'max_episodes': 1000, 'max_users': 100, 'max_storage_mb': 10000},
        )
        user, created = User.objects.get_or_create(
            username='liorpo',
            defaults={
                'email': 'liorpo@sso.local',
                'role': 'admin',
                'organization': org,
                'is_active': True,
            },
        )
        if created:
            user.set_unusable_password()
            user.save()
        refresh = SpeechyTokenObtainPairSerializer.get_token(user)
        access_token = refresh.access_token
        # SSO sessions are long-lived, unlike the 8h lifetime for password logins.
        access_token.set_exp(lifetime=timedelta(days=30))
        access = str(access_token)
        origins = getattr(django_settings, 'CORS_ALLOWED_ORIGINS', ['http://localhost:3000'])
        client_origin = origins[0] if origins else 'http://localhost:3000'
        response = redirect(f'{client_origin}/sso/callback?token={access}')
        # The popup is cross-origin to the client until this redirect lands, so
        # SecurityMiddleware's default same-origin COOP would sever window.opener
        # before the callback page can postMessage back to it.
        response['Cross-Origin-Opener-Policy'] = 'unsafe-none'
        return response


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
        data['key'] = raw
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
