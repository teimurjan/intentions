"""Deterministic mock adapter for testing."""

import hashlib
import re

from promptlab.schemas import CompletionRequest, CompletionResponse


class MockClient:
    """Deterministic mock LLM client for testing."""

    provider_name = "mock"

    def __init__(self, seed: int = 1337):
        self.seed = seed

    def _generate_deterministic(self, prompt: str, task_hint: str) -> str:
        """Generate deterministic output based on prompt hash."""
        prompt_hash = hashlib.md5(
            f"{self.seed}:{prompt}".encode(), usedforsecurity=False
        ).hexdigest()
        hash_int = int(prompt_hash[:8], 16)

        if "rewrite" in task_hint.lower() or "formal" in prompt.lower() or "casual" in prompt.lower():
            return self._mock_rewrite(prompt, hash_int)
        if "complete" in task_hint.lower() or "continue" in prompt.lower():
            return self._mock_complete(prompt, hash_int)
        if "summar" in task_hint.lower():
            return self._mock_summarize(prompt, hash_int)
        if "explain" in task_hint.lower():
            return self._mock_explain(prompt, hash_int)
        if "query" in prompt.lower() and "items" in prompt.lower():
            return self._mock_search(prompt, hash_int)

        return f"Mock response {hash_int % 1000}"

    def _mock_rewrite(self, prompt: str, hash_int: int) -> str:
        """Generate mock rewrite output."""
        words = ["The", "This", "Our", "A", "That"]
        adjectives = ["important", "significant", "notable", "key", "essential"]
        verbs = ["demonstrates", "shows", "indicates", "reveals", "suggests"]
        nouns = ["approach", "method", "strategy", "technique", "solution"]

        w = words[hash_int % len(words)]
        a = adjectives[(hash_int >> 4) % len(adjectives)]
        v = verbs[(hash_int >> 8) % len(verbs)]
        n = nouns[(hash_int >> 12) % len(nouns)]

        return f"{w} {a} {n} {v} the desired outcome."

    def _mock_complete(self, prompt: str, hash_int: int) -> str:
        """Generate mock completion output."""
        continuations = [
            "and this leads to improved results.",
            "which provides additional context.",
            "resulting in better outcomes overall.",
            "and demonstrates the key principles.",
            "showing how this approach works.",
        ]
        return continuations[hash_int % len(continuations)]

    def _mock_summarize(self, prompt: str, hash_int: int) -> str:
        """Generate mock summary output."""
        summaries = [
            "The text discusses key concepts and their applications.",
            "This passage outlines the main ideas and supporting details.",
            "The content covers important topics and their implications.",
            "A brief overview of the subject matter and key points.",
            "The text presents core arguments and relevant examples.",
        ]
        return summaries[hash_int % len(summaries)]

    def _mock_explain(self, prompt: str, hash_int: int) -> str:
        """Generate mock explanation output (1-2 sentences)."""
        explanations = [
            "This refers to a concept that involves specific processes. It is commonly used in various contexts.",
            "The term describes a method for achieving particular goals. Applications include multiple domains.",
            "This represents an approach to solving certain problems. It has practical implications.",
        ]
        return explanations[hash_int % len(explanations)]

    def _mock_search(self, prompt: str, hash_int: int) -> str:
        """Generate mock search ranking output."""
        id_pattern = re.compile(r"ID:\s*(\w+)")
        ids = id_pattern.findall(prompt)

        if not ids:
            ids = [f"item_{i}" for i in range(5)]

        lines = []
        for i, item_id in enumerate(ids):
            score = max(0, min(100, 95 - i * 15 + (hash_int + i) % 20))
            lines.append(f"{item_id} {score}")

        return "\n".join(lines)

    def complete_sync(self, request: CompletionRequest) -> CompletionResponse:
        """Synchronous completion."""
        task_hint = request.system_prompt + request.user_prompt
        text = self._generate_deterministic(request.user_prompt, task_hint)
        return CompletionResponse(
            text=text,
            tokens_used=len(text.split()) * 2,
            model=request.model,
        )

    async def complete(self, request: CompletionRequest) -> CompletionResponse:
        """Asynchronous completion."""
        return self.complete_sync(request)

    def supports_model(self, model_id: str) -> bool:
        """Mock supports any model."""
        return "mock" in model_id.lower() or model_id == ""
