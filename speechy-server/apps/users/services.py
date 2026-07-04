from django.utils import timezone
from django.utils.text import slugify
from rest_framework_simplejwt.tokens import RefreshToken
from .models import Organization, User, APIKey, UserSession, AuditLog


def login_user(username: str, password: str):
    try:
        user = User.objects.get(username=username)
    except User.DoesNotExist:
        return None, None
    if not user.check_password(password) or not user.is_active:
        return None, None
    refresh = RefreshToken.for_user(user)
    return user, refresh


def create_session(user: User, refresh_token, ip: str, user_agent: str) -> UserSession:
    jti = str(refresh_token['jti'])
    session, _ = UserSession.objects.get_or_create(
        refresh_token_jti=jti,
        defaults={'user': user, 'ip_address': ip, 'user_agent': user_agent},
    )
    return session


def revoke_session(session: UserSession):
    session.is_active = False
    session.save(update_fields=['is_active'])


def create_api_key(user: User, name: str):
    raw, prefix, key_hash = APIKey.generate()
    api_key = APIKey.objects.create(user=user, name=name, key_prefix=prefix, key_hash=key_hash)
    return api_key, raw


def revoke_api_key(api_key: APIKey):
    api_key.revoked_at = timezone.now()
    api_key.save(update_fields=['revoked_at'])


def register_user(username: str, email: str, password: str, organization_name: str):
    base_slug = slugify(organization_name) or 'org'
    slug = base_slug
    counter = 1
    while Organization.objects.filter(slug=slug).exists():
        slug = f'{base_slug}-{counter}'
        counter += 1
    org = Organization.objects.create(name=organization_name, slug=slug)
    user = User.objects.create_user(username=username, email=email, password=password, organization=org)
    refresh = RefreshToken.for_user(user)
    return user, refresh


def log_action(user, action: str, resource_type: str = '', resource_id: str = '', details: dict = None):
    org = getattr(user, 'organization', None)
    AuditLog.objects.create(
        user=user,
        organization=org,
        action=action,
        resource_type=resource_type,
        resource_id=str(resource_id),
        details=details or {},
    )
