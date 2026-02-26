"""Anthropic Claude adapter."""

import os

from promptlab.schemas import CompletionRequest, CompletionResponse


class AnthropicClient:
    """Anthropic Claude LLM client."""

    provider_name = "anthropic"

    def __init__(self, api_key: str | None = None):
        try:
            from anthropic import Anthropic, AsyncAnthropic
        except ImportError as e:
            raise ImportError("Install anthropic: pip install anthropic") from e

        self.api_key = api_key or os.environ.get("ANTHROPIC_API_KEY")
        if not self.api_key:
            raise ValueError("Anthropic API key required")

        self.client = Anthropic(api_key=self.api_key)
        self.async_client = AsyncAnthropic(api_key=self.api_key)

    def complete_sync(self, request: CompletionRequest) -> CompletionResponse:
        """Synchronous completion."""
        response = self.client.messages.create(
            model=request.model,
            system=request.system_prompt,
            messages=[{"role": "user", "content": request.user_prompt}],
            max_tokens=request.max_tokens,
            temperature=request.temperature,
        )

        text = ""
        for block in response.content:
            if hasattr(block, "text"):
                text += block.text

        tokens = response.usage.input_tokens + response.usage.output_tokens

        return CompletionResponse(text=text, tokens_used=tokens, model=request.model)

    async def complete(self, request: CompletionRequest) -> CompletionResponse:
        """Asynchronous completion."""
        response = await self.async_client.messages.create(
            model=request.model,
            system=request.system_prompt,
            messages=[{"role": "user", "content": request.user_prompt}],
            max_tokens=request.max_tokens,
            temperature=request.temperature,
        )

        text = ""
        for block in response.content:
            if hasattr(block, "text"):
                text += block.text

        tokens = response.usage.input_tokens + response.usage.output_tokens

        return CompletionResponse(text=text, tokens_used=tokens, model=request.model)

    def supports_model(self, model_id: str) -> bool:
        """Check if model is supported."""
        return "claude" in model_id.lower()
