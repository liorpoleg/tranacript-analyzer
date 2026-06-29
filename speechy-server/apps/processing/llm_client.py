import requests
from django.conf import settings


class LLMError(Exception):
    pass


class LLMClient:
    def __init__(self):
        # EXTERNAL_URL: LLM_ENDPOINT is the only outbound URL in this system
        self.endpoint = settings.LLM_ENDPOINT
        self.model = settings.LLM_MODEL
        self.timeout = settings.LLM_TIMEOUT
        self._session = requests.Session()

    def complete(self, prompt: str) -> str:
        if not self.endpoint:
            raise LLMError('LLM_ENDPOINT is not configured.')
        payload = {
            'model': self.model,
            'messages': [{'role': 'user', 'content': prompt}],
            'temperature': 0.3,
        }
        try:
            response = self._session.post(self.endpoint, json=payload, timeout=self.timeout)
            response.raise_for_status()
        except requests.RequestException as e:
            raise LLMError(f'LLM request failed: {e}') from e
        try:
            return response.json()['choices'][0]['message']['content']
        except (KeyError, IndexError) as e:
            raise LLMError(f'Unexpected LLM response shape: {e}') from e
