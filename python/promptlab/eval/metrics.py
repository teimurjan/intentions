"""Shared evaluation metrics."""

import re
from collections import Counter


def tokenize(text: str) -> list[str]:
    """Simple whitespace tokenizer with lowercasing."""
    return text.lower().split()


def lcs_length(seq1: list[str], seq2: list[str]) -> int:
    """Compute longest common subsequence length."""
    m, n = len(seq1), len(seq2)
    if m == 0 or n == 0:
        return 0

    dp = [[0] * (n + 1) for _ in range(m + 1)]
    for i in range(1, m + 1):
        for j in range(1, n + 1):
            if seq1[i - 1] == seq2[j - 1]:
                dp[i][j] = dp[i - 1][j - 1] + 1
            else:
                dp[i][j] = max(dp[i - 1][j], dp[i][j - 1])

    return dp[m][n]


def rouge_l(output: str, reference: str) -> float:
    """Compute ROUGE-L F1 score."""
    output_tokens = tokenize(output)
    ref_tokens = tokenize(reference)

    if not output_tokens or not ref_tokens:
        return 0.0

    lcs = lcs_length(output_tokens, ref_tokens)

    precision = lcs / len(output_tokens) if output_tokens else 0.0
    recall = lcs / len(ref_tokens) if ref_tokens else 0.0

    if precision + recall == 0:
        return 0.0

    return 2 * precision * recall / (precision + recall)


def token_overlap(text1: str, text2: str) -> float:
    """Compute token overlap (Jaccard similarity)."""
    tokens1 = set(tokenize(text1))
    tokens2 = set(tokenize(text2))

    if not tokens1 or not tokens2:
        return 0.0

    intersection = tokens1 & tokens2
    union = tokens1 | tokens2

    return len(intersection) / len(union)


def token_f1(output: str, reference: str) -> float:
    """Compute token-level F1 score."""
    output_tokens = Counter(tokenize(output))
    ref_tokens = Counter(tokenize(reference))

    if not output_tokens or not ref_tokens:
        return 0.0

    common = output_tokens & ref_tokens
    num_common = sum(common.values())

    if num_common == 0:
        return 0.0

    precision = num_common / sum(output_tokens.values())
    recall = num_common / sum(ref_tokens.values())

    return 2 * precision * recall / (precision + recall)


def brevity_score(output: str, target_words: int, tolerance: float = 0.3) -> float:
    """Score based on output length relative to target."""
    word_count = len(output.split())

    if word_count == 0:
        return 0.0

    ratio = word_count / target_words

    if ratio <= 1.0:
        return ratio
    else:
        excess = ratio - 1.0
        penalty = min(excess / tolerance, 1.0)
        return max(0.0, 1.0 - penalty)


def repetition_score(text: str, ngram_size: int = 3) -> float:
    """Score inversely proportional to n-gram repetition (1.0 = no repetition)."""
    tokens = tokenize(text)

    if len(tokens) < ngram_size:
        return 1.0

    ngrams = [tuple(tokens[i : i + ngram_size]) for i in range(len(tokens) - ngram_size + 1)]

    if not ngrams:
        return 1.0

    unique_ratio = len(set(ngrams)) / len(ngrams)
    return unique_ratio


def key_term_overlap(output: str, reference: str, min_term_length: int = 4) -> float:
    """Compute overlap of key terms (longer words)."""
    output_terms = {w for w in tokenize(output) if len(w) >= min_term_length}
    ref_terms = {w for w in tokenize(reference) if len(w) >= min_term_length}

    if not ref_terms:
        return 1.0

    if not output_terms:
        return 0.0

    overlap = len(output_terms & ref_terms)
    return overlap / len(ref_terms)


def semantic_preservation(output: str, input_text: str) -> float:
    """Estimate semantic preservation through key term retention."""
    input_terms = {w for w in tokenize(input_text) if len(w) >= 4}
    output_terms = {w for w in tokenize(output) if len(w) >= 4}

    if not input_terms:
        return 1.0

    preserved = len(input_terms & output_terms)
    return preserved / len(input_terms)
