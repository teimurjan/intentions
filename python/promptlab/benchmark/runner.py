"""Benchmark runner for prompt variants."""

from dataclasses import dataclass

from rich.console import Console
from rich.table import Table

from promptlab.adapters import get_client
from promptlab.benchmark.prompts import PROMPTS_BY_TASK
from promptlab.benchmark.winners import save_winner
from promptlab.config import Config
from promptlab.datasets import load_dataset
from promptlab.eval import get_evaluator
from promptlab.schemas import CompletionRequest, DatasetExample
from promptlab.types import TaskType

console = Console()


@dataclass
class PromptVariant:
    name: str
    system: str
    user: str


def format_prompt(
    variant: PromptVariant,
    example: DatasetExample,
) -> tuple[str, str]:
    """Format prompt with example data."""
    user = variant.user.format(text=example.input_text)
    return variant.system, user


def run_benchmark(
    task_type: TaskType,
    config: Config,
    num_examples: int = 20,
) -> dict[str, dict[str, float]]:
    """Benchmark all prompt variants for a task."""
    dataset = load_dataset(
        task_type,
        split="val",
        size=num_examples,
        cache_dir=config.datasets.cache_dir,
    )

    client = get_client(
        config.llm.provider,
        api_key=config.llm.api_key,
        base_url=config.llm.base_url,
    )
    evaluator = get_evaluator(task_type)
    variants = PROMPTS_BY_TASK.get(task_type, [])

    results: dict[str, dict[str, float]] = {}

    for i, variant in enumerate(variants):
        name = f"variant_{i}"
        console.print(f"  Testing [cyan]{name}[/cyan]...")

        scores = []
        format_passed = 0

        for example in dataset:
            system, user = format_prompt(
                PromptVariant(name=name, system=variant.system, user=variant.user),
                example,
            )

            request = CompletionRequest(
                model=config.llm.model,
                system_prompt=system,
                user_prompt=user,
                max_tokens=256,
                temperature=0.0,
                thinking=variant.thinking,
            )

            try:
                response = client.complete_sync(request)
                output = response.text

                eval_result = evaluator.evaluate(output, example)
                scores.append(eval_result.score)
                if eval_result.format_passed:
                    format_passed += 1
            except Exception as e:
                console.print(f"    [red]Error: {e}[/red]")
                scores.append(0.0)

        avg_score = sum(scores) / len(scores) if scores else 0.0
        pass_rate = format_passed / len(dataset) if dataset else 0.0

        results[name] = {
            "score": avg_score,
            "format_pass_rate": pass_rate,
            "system": variant.system,
            "user": variant.user,
            "thinking": variant.thinking,
        }

        console.print(f"    [bold]score={avg_score:.3f}, format={pass_rate:.0%}[/bold]")

    if results:
        best_name = max(results, key=lambda k: results[k]["score"])
        best = results[best_name]
        save_winner(
            model_id=config.llm.model,
            task_type=task_type,
            system=best["system"],
            user=best["user"],
            score=best["score"],
            format_pass_rate=best["format_pass_rate"],
            thinking=best.get("thinking", False),
        )
        console.print(f"  [green]Saved winner: {best_name}[/green]")

    return results


def run_all_benchmarks(
    config: Config,
    num_examples: int = 20,
) -> dict[str, dict[str, dict[str, float]]]:
    """Benchmark all tasks and return results."""
    all_results: dict[str, dict[str, dict[str, float]]] = {}

    for task_type in TaskType:
        console.print(f"\n[bold blue]Benchmarking {task_type.value}[/bold blue]")
        results = run_benchmark(task_type, config, num_examples)
        all_results[task_type.value] = results

    return all_results


def print_benchmark_results(results: dict[str, dict[str, dict[str, float]]]) -> None:
    """Print benchmark results as tables."""
    console.print("\n[bold green]═══ BENCHMARK RESULTS ═══[/bold green]\n")

    for task_name, variants in results.items():
        table = Table(title=f"{task_name.upper()}")
        table.add_column("Prompt Variant", style="cyan")
        table.add_column("Score", justify="right")
        table.add_column("Format Pass", justify="right")
        table.add_column("", justify="center")

        sorted_variants = sorted(
            variants.items(),
            key=lambda x: x[1]["score"],
            reverse=True,
        )

        for i, (name, scores) in enumerate(sorted_variants):
            marker = "👑" if i == 0 else ""
            table.add_row(
                name,
                f"{scores['score']:.3f}",
                f"{scores['format_pass_rate']:.0%}",
                marker,
            )

        console.print(table)
        console.print()
