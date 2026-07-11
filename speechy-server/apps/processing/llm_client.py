import requests
from django.conf import settings


class LLMError(Exception):
    pass


class LLMClient:
    def __init__(self):
        # EXTERNAL_URL: LLM_ENDPOINT is the only outbound URL in this system
        self.endpoint = settings.LLM_ENDPOINT.strip().rstrip('/')
        # self.endpoint = settings.LLM_ENDPOINT
        self.model = settings.LLM_MODEL
        self.timeout = settings.LLM_TIMEOUT
        self._session = requests.Session()
        api_key = settings.LLM_API_KEY
        if api_key:
            self._session.headers['Authorization'] = f'Bearer {api_key}'

    def _post(self, messages: list[dict], temperature: float = 0.3) -> str:
        if not self.endpoint:
            raise LLMError('LLM_ENDPOINT is not configured.')
        payload = {'model': self.model, 'messages': messages, 'temperature': temperature}
        try:
            response = self._session.post(self.endpoint, json=payload, timeout=self.timeout)
            response.raise_for_status()
        except requests.RequestException as e:
            raise LLMError(f'LLM request failed: {e}') from e
        try:
            return response.json()['choices'][0]['message']['content']
        except (KeyError, IndexError) as e:
            raise LLMError(f'Unexpected LLM response shape: {e}') from e

    def complete(self, prompt: str) -> str:
        return self._post([{'role': 'user', 'content': prompt}])

    def chat(self, system_prompt: str, messages: list[dict]) -> str:
        """Multi-turn chat. messages is a list of {role, content} dicts."""
        all_messages = [{'role': 'system', 'content': system_prompt}] + messages
        return self._post(all_messages, temperature=0.7)
