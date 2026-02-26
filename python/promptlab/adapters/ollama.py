"""Ollama local model adapter."""

from promptlab.schemas import CompletionRequest, CompletionResponse


class OllamaClient:
    """Ollama local LLM client."""

    provider_name = "ollama"

    def __init__(self, base_url: str | None = None):
        try:
            from ollama import AsyncClient, Client
        except ImportError as e:
            raise ImportError("Install ollama: pip install ollama") from e

        self.base_url = base_url or "http://localhost:11434"
        self.client = Client(host=self.base_url)
        self.async_client = AsyncClient(host=self.base_url)

    def complete_sync(self, request: CompletionRequest) -> CompletionResponse:
        """Synchronous completion."""
        response = self.client.chat(
            model=request.model,
            messages=[
                {"role": "system", "content": request.system_prompt},
                {"role": "user", "content": request.user_prompt},
            ],
            options={
                "num_predict": request.max_tokens,
                "temperature": request.temperature,
            },
            think=request.thinking,
        )

        message = response.get("message", {})
        text = message.get("content", "")

        # Fallback: check thinking field if content is empty
        if not text and hasattr(message, "thinking") and message.thinking:
            text = message.thinking

        tokens = response.get("eval_count", 0) + response.get("prompt_eval_count", 0)

        return CompletionResponse(text=text, tokens_used=tokens, model=request.model)

    async def complete(self, request: CompletionRequest) -> CompletionResponse:
        """Asynchronous completion."""
        response = await self.async_client.chat(
            model=request.model,
            messages=[
                {"role": "system", "content": request.system_prompt},
                {"role": "user", "content": request.user_prompt},
            ],
            options={
                "num_predict": request.max_tokens,
                "temperature": request.temperature,
            },
            think=request.thinking,
        )

        message = response.get("message", {})
        text = message.get("content", "")

        # Fallback: check thinking field if content is empty
        if not text and hasattr(message, "thinking") and message.thinking:
            text = message.thinking

        tokens = response.get("eval_count", 0) + response.get("prompt_eval_count", 0)

        return CompletionResponse(text=text, tokens_used=tokens, model=request.model)

    def supports_model(self, model_id: str) -> bool:
        """Ollama supports any model that's been pulled."""
        return True
