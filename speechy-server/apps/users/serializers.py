from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import Organization, User, APIKey, UserSession, AuditLog


class SpeechyTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Extends the default pair serializer with permission_groups and username claims."""

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['username'] = user.username
        token['permission_groups'] = (
            ['speechy_admins', 'speechy_viewers'] if user.role == 'admin' else ['speechy_viewers']
        )
        return token


class OrganizationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Organization
        fields = ['id', 'name', 'slug', 'max_episodes', 'max_users', 'max_storage_mb', 'created_at']
        read_only_fields = ['id', 'created_at']


class UserSerializer(serializers.ModelSerializer):
    organization_name = serializers.CharField(source='organization.name', read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'role', 'organization', 'organization_name',
                  'is_active', 'date_joined', 'last_login']
        read_only_fields = ['id', 'date_joined', 'last_login']


class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'role', 'organization']

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


class APIKeySerializer(serializers.ModelSerializer):
    is_active = serializers.BooleanField(read_only=True)

    class Meta:
        model = APIKey
        fields = ['id', 'name', 'key_prefix', 'is_active', 'created_at', 'revoked_at']
        read_only_fields = ['id', 'key_prefix', 'created_at', 'revoked_at']


class APIKeyCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = APIKey
        fields = ['name']


class UserSessionSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = UserSession
        fields = ['id', 'username', 'ip_address', 'user_agent', 'login_at', 'last_active_at', 'is_active']
        read_only_fields = fields


class AuditLogSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True, allow_null=True)

    class Meta:
        model = AuditLog
        fields = ['id', 'username', 'action', 'resource_type', 'resource_id', 'details', 'timestamp']
        read_only_fields = fields


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)


class RegisterSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True)
    organization_name = serializers.CharField(max_length=255)

    def validate(self, data):
        if data['password'] != data['confirm_password']:
            raise serializers.ValidationError({'confirm_password': 'Passwords do not match.'})
        if User.objects.filter(username=data['username']).exists():
            raise serializers.ValidationError({'username': 'That username is already taken.'})
        if User.objects.filter(email=data['email']).exists():
            raise serializers.ValidationError({'email': 'An account with that email already exists.'})
        return data
