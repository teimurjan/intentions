"""OpenAI and OpenAI-compatible adapter."""

import os

from promptlab.schemas import CompletionRequest, CompletionResponse


class OpenAIClient:
    """OpenAI and OpenAI-compatible LLM client."""

    provider_name = "openai"

    def __init__(self, api_key: str | None = None, base_url: str | None = None):
        try:
            from openai import AsyncOpenAI, OpenAI
        except ImportError as e:
            raise ImportError("Install openai: pip install openai") from e

        self.api_key = api_key or os.environ.get("OPENAI_API_KEY")
        if not self.api_key:
            raise ValueError("OpenAI API key required")

        self.client = OpenAI(api_key=self.api_key, base_url=base_url)
        self.async_client = AsyncOpenAI(api_key=self.api_key, base_url=base_url)

    def complete_sync(self, request: CompletionRequest) -> CompletionResponse:
        """Synchronous completion."""
        # GPT-5+ models use max_completion_tokens and don't support temperature
        is_gpt5 = request.model.startswith("gpt-5")

        kwargs = {
            "model": request.model,
            "messages": [
                {"role": "system", "content": request.system_prompt},
                {"role": "user", "content": request.user_prompt},
            ],
        }

        if is_gpt5:
            kwargs["max_completion_tokens"] = max(request.max_tokens, 1000)
        else:
            kwargs["max_tokens"] = request.max_tokens
            kwargs["temperature"] = request.temperature

        response = self.client.chat.completions.create(**kwargs)

        text = response.choices[0].message.content or ""
        tokens = response.usage.total_tokens if response.usage else 0

        return CompletionResponse(text=text, tokens_used=tokens, model=request.model)

    async def complete(self, request: CompletionRequest) -> CompletionResponse:
        """Asynchronous completion."""
        is_gpt5 = request.model.startswith("gpt-5")

        kwargs = {
            "model": request.model,
            "messages": [
                {"role": "system", "content": request.system_prompt},
                {"role": "user", "content": request.user_prompt},
            ],
        }

        if is_gpt5:
            kwargs["max_completion_tokens"] = max(request.max_tokens, 1000)
        else:
            kwargs["max_tokens"] = request.max_tokens
            kwargs["temperature"] = request.temperature

        response = await self.async_client.chat.completions.create(**kwargs)

        text = response.choices[0].message.content or ""
        tokens = response.usage.total_tokens if response.usage else 0

        return CompletionResponse(text=text, tokens_used=tokens, model=request.model)

    def supports_model(self, model_id: str) -> bool:
        """Check if model is supported."""
        openai_prefixes = ("gpt-", "o1", "o3", "text-", "davinci", "curie", "babbage", "ada")
        return any(model_id.lower().startswith(p) for p in openai_prefixes)
