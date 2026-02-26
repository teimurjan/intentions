"""Format compliance gates that hard-gate scores to 0 if violated."""

import re


def check_no_preamble(output: str) -> tuple[bool, str]:
    """Check that output has no preamble like 'Sure', 'Here's', etc."""
    preamble_patterns = [
        r"^(sure|okay|ok|yes|no problem|of course|certainly|absolutely|here's|here is|i'd be|i would be|i'll|i will|let me|allow me)",
        r"^(here you go|there you go|got it|understood|right away)",
        r"^(as requested|as you asked|as per your|per your request)",
    ]

    output_lower = output.strip().lower()
    for pattern in preamble_patterns:
        if re.match(pattern, output_lower):
            return False, f"Output starts with preamble matching: {pattern}"

    return True, ""


def check_no_markdown(output: str) -> tuple[bool, str]:
    """Check that output contains no markdown formatting."""
    markdown_patterns = [
        r"^#+\s",  # Headers
        r"\*\*[^*]+\*\*",  # Bold
        r"\*[^*]+\*",  # Italic
        r"```",  # Code blocks
        r"`[^`]+`",  # Inline code
        r"^\s*[-*]\s",  # Lists
        r"^\s*\d+\.\s",  # Numbered lists
        r"\[.+\]\(.+\)",  # Links
    ]

    for pattern in markdown_patterns:
        if re.search(pattern, output, re.MULTILINE):
            return False, f"Output contains markdown: {pattern}"

    return True, ""


def check_no_quotes(output: str) -> tuple[bool, str]:
    """Check that output is not wrapped in quotes."""
    stripped = output.strip()
    if (stripped.startswith('"') and stripped.endswith('"')) or (
        stripped.startswith("'") and stripped.endswith("'")
    ):
        return False, "Output is wrapped in quotes"
    return True, ""


def check_no_input_repetition(output: str, input_text: str) -> tuple[bool, str]:
    """Check that output doesn't repeat significant parts of input."""
    output_lower = output.lower().strip()
    input_lower = input_text.lower().strip()

    if len(output_lower) < 20:
        return True, ""

    if output_lower.startswith(input_lower):
        return False, "Output repeats input text"

    input_words = input_lower.split()
    output_words = output_lower.split()

    if len(input_words) >= 3 and len(output_words) >= len(input_words):
        if output_words[: len(input_words)] == input_words:
            return False, "Output repeats input text"

    return True, ""


def check_word_limit(output: str, max_words: int) -> tuple[bool, str]:
    """Check that output is within word limit."""
    word_count = len(output.split())
    if word_count > max_words:
        return False, f"Output exceeds {max_words} word limit ({word_count} words)"
    return True, ""


def check_sentence_count(output: str, min_sentences: int, max_sentences: int) -> tuple[bool, str]:
    """Check that output has appropriate sentence count."""
    sentence_pattern = r"[.!?]+(?:\s|$)"
    sentences = re.split(sentence_pattern, output.strip())
    sentences = [s.strip() for s in sentences if s.strip()]
    count = len(sentences)

    if count < min_sentences:
        return False, f"Output has fewer than {min_sentences} sentences ({count})"
    if count > max_sentences:
        return False, f"Output exceeds {max_sentences} sentences ({count})"

    return True, ""


class RewriteGates:
    """Format gates for rewrite task."""

    @staticmethod
    def check(output: str, input_text: str) -> tuple[bool, str]:
        checks = [
            check_no_preamble(output),
            check_no_markdown(output),
            check_no_quotes(output),
        ]
        for passed, msg in checks:
            if not passed:
                return False, msg
        return True, ""


class CompleteGates:
    """Format gates for completion task."""

    @staticmethod
    def check(output: str, input_text: str) -> tuple[bool, str]:
        checks = [
            check_no_preamble(output),
            check_no_input_repetition(output, input_text),
        ]
        for passed, msg in checks:
            if not passed:
                return False, msg
        return True, ""


class SummarizeGates:
    """Format gates for summarization task."""

    MAX_WORDS = 60

    @staticmethod
    def check(output: str, input_text: str) -> tuple[bool, str]:
        checks = [
            check_no_preamble(output),
            check_word_limit(output, SummarizeGates.MAX_WORDS),
        ]
        for passed, msg in checks:
            if not passed:
                return False, msg
        return True, ""


class ExplainGates:
    """Format gates for explanation task."""

    @staticmethod
    def check(output: str, input_text: str) -> tuple[bool, str]:
        checks = [
            check_no_preamble(output),
            check_sentence_count(output, 1, 2),
        ]
        for passed, msg in checks:
            if not passed:
                return False, msg
        return True, ""
