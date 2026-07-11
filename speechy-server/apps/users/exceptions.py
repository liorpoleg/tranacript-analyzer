from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework.exceptions import AuthenticationFailed, NotAuthenticated


def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)
    if response is not None:
        if isinstance(exc, NotAuthenticated):
            response.data = {'data': None, 'error': {'code': 401, 'missing': True}}
            return response
        if isinstance(exc, AuthenticationFailed) and isinstance(exc.detail, dict):
            response.data = {'data': None, 'error': {'code': 401, **exc.detail}}
            return response
        detail = response.data
        if isinstance(detail, dict) and 'detail' in detail:
            message = str(detail['detail'])
        elif isinstance(detail, list):
            message = str(detail[0]) if detail else 'An error occurred.'
        else:
            message = str(detail)
        response.data = {
            'data': None,
            'error': {'code': response.status_code, 'message': message},
        }
    return response
