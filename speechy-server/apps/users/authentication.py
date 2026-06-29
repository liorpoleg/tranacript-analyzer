from django.conf import settings
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import TokenError
from .models import User


class CookieJWTAuthentication(BaseAuthentication):
    def authenticate(self, request):
        cookie_name = getattr(settings, 'JWT_COOKIE_NAME', 'speechy_access')
        raw_token = request.COOKIES.get(cookie_name)
        if raw_token is None:
            return None
        try:
            token = AccessToken(raw_token)
        except TokenError as e:
            raise AuthenticationFailed(str(e))
        try:
            user = User.objects.get(id=token['user_id'])
        except User.DoesNotExist:
            raise AuthenticationFailed('User not found.')
        if not user.is_active:
            raise AuthenticationFailed('User is inactive.')
        return user, token
