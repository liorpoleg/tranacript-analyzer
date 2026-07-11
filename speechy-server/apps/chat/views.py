from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from apps.processing.llm_client import LLMError
from .services import run_chat


class ChatView(APIView):

    def post(self, request):
        episode_ids = request.data.get('episode_ids', [])
        messages = request.data.get('messages', [])

        if not episode_ids:
            return Response(
                {'data': None, 'error': {'code': 400, 'message': 'episode_ids is required.'}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not messages or not isinstance(messages, list):
            return Response(
                {'data': None, 'error': {'code': 400, 'message': 'messages must be a non-empty list.'}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        for msg in messages:
            if msg.get('role') not in ('user', 'assistant') or not msg.get('content'):
                return Response(
                    {'data': None, 'error': {'code': 400, 'message': 'Each message must have role (user|assistant) and content.'}},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        try:
            result = run_chat(episode_ids=episode_ids, messages=messages)
        except LLMError as e:
            return Response(
                {'data': None, 'error': {'code': 502, 'message': str(e)}},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        return Response({'data': result, 'error': None})
