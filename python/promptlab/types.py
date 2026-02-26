"""Enums and type definitions."""

from enum import Enum


class TaskType(str, Enum):
    REWRITE_FRIENDLY = "rewrite_friendly"
    REWRITE_CONCISE = "rewrite_concise"
    COMPLETE = "complete"
    SUMMARIZE = "summarize"
    EXPLAIN = "explain"
