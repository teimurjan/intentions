"""Benchmark module for testing prompt variants."""

from promptlab.benchmark.runner import (
    run_benchmark,
    run_all_benchmarks,
    print_benchmark_results,
)
from promptlab.benchmark.prompts import PROMPTS_BY_TASK

__all__ = [
    "run_benchmark",
    "run_all_benchmarks",
    "print_benchmark_results",
    "PROMPTS_BY_TASK",
]
