"""Base protocol for LLM clients."""

from typing import Protocol, runtime_checkable

from promptlab.schemas import CompletionRequest, CompletionResponse


@runtime_checkable
class LLMClient(Protocol):
    """Protocol for LLM client implementations."""

    provider_name: str

    def complete_sync(self, request: CompletionRequest) -> CompletionResponse:
        """Synchronous completion."""
        ...

    async def complete(self, request: CompletionRequest) -> CompletionResponse:
        """Asynchronous completion."""
        ...

    def supports_model(self, model_id: str) -> bool:
        """Check if this client supports the given model."""
        ...
