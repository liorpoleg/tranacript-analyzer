import base64
import json
from datetime import datetime, timezone as dt_timezone

from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import TokenError

from .models import User

ALLOWED_GROUPS = {'speechy_admins', 'speechy_viewers'}


def _is_expired(raw_token: str) -> bool:
    """Decode JWT payload without signature verification to check expiry."""
    try:
        parts = raw_token.split('.')
        if len(parts) != 3:
            return False
        padding = '=' * (-len(parts[1]) % 4)
        payload = json.loads(base64.urlsafe_b64decode(parts[1] + padding).decode('utf-8'))
        exp = payload.get('exp')
        return exp is not None and datetime.now(dt_timezone.utc).timestamp() > exp
    except Exception:
        return False


class HeaderJWTAuthentication(BaseAuthentication):
    """
    Authenticate via Authorization: Bearer <token> header.
    Returns None (anonymous) when no header is present so AllowAny views still work.
    Raises AuthenticationFailed with a typed flag dict for invalid/expired/unauthorized tokens.
    """

    def authenticate(self, request):
        header = request.headers.get('Authorization', '')
        if not header.startswith('Bearer '):
            # No token — let permission classes decide whether anonymous is allowed.
            return None

        raw_token = header[7:]
        try:
            token = AccessToken(raw_token)
        except TokenError:
            if _is_expired(raw_token):
                raise AuthenticationFailed({'expired': True})
            raise AuthenticationFailed({'missing': True})

        groups = token.get('permission_groups', [])
        if not any(g in ALLOWED_GROUPS for g in groups):
            raise AuthenticationFailed({'unauthorized': True})

        try:
            user = User.objects.get(id=token['user_id'])
        except User.DoesNotExist:
            raise AuthenticationFailed({'missing': True})

        if not user.is_active:
            raise AuthenticationFailed({'missing': True})

        return (user, token)

    def authenticate_header(self, request):
        return 'Bearer'
