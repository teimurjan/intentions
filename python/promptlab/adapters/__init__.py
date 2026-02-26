"""LLM adapter implementations."""

from promptlab.adapters.base import LLMClient
from promptlab.adapters.mock import MockClient


def get_client(provider: str, **kwargs: str | None) -> LLMClient:
    """Factory to get LLM client by provider name."""
    if provider == "mock":
        return MockClient()

    if provider == "openai":
        from promptlab.adapters.openai import OpenAIClient

        return OpenAIClient(
            api_key=kwargs.get("api_key"),
            base_url=kwargs.get("base_url"),
        )

    if provider == "anthropic":
        from promptlab.adapters.anthropic import AnthropicClient

        return AnthropicClient(api_key=kwargs.get("api_key"))

    if provider == "ollama":
        from promptlab.adapters.ollama import OllamaClient

        return OllamaClient(base_url=kwargs.get("base_url"))

    raise ValueError(f"Unknown provider: {provider}")


__all__ = ["LLMClient", "MockClient", "get_client"]
