"""Typer CLI for promptlab."""

import json
from datetime import datetime
from pathlib import Path
from typing import Annotated

from dotenv import load_dotenv
import typer

load_dotenv()
from rich.console import Console
from rich.table import Table

from promptlab.benchmark import run_all_benchmarks, run_benchmark, print_benchmark_results
from promptlab.benchmark.winners import save_winner
from promptlab.config import Config, load_config, save_config_template
from promptlab.optim import run_optimization, optimize_all_tasks
from promptlab.schemas import OptimizationResult, OutputJSON
from promptlab.types import TaskType

app = typer.Typer(
    name="promptlab",
    help="GEPA-based prompt optimization for LLM tasks",
    add_completion=False,
)
console = Console()


@app.command()
def init_config(
    path: Annotated[
        Path,
        typer.Option("--path", "-p", help="Output path for config file"),
    ] = Path("promptlab.toml"),
) -> None:
    """Generate a configuration template file."""
    if path.exists():
        overwrite = typer.confirm(f"{path} already exists. Overwrite?")
        if not overwrite:
            raise typer.Abort()

    save_config_template(path)
    console.print(f"[green]Created config template at {path}[/green]")


@app.command()
def optimize(
    models: Annotated[
        str,
        typer.Option("--models", "-m", help="Comma-separated list of model IDs"),
    ] = "mock-model",
    seed: Annotated[
        int,
        typer.Option("--seed", "-s", help="Random seed for reproducibility"),
    ] = 1337,
    config_path: Annotated[
        Path | None,
        typer.Option("--config", "-c", help="Path to config file"),
    ] = None,
    output_dir: Annotated[
        Path | None,
        typer.Option("--output", "-o", help="Output directory for results"),
    ] = None,
    tasks: Annotated[
        str | None,
        typer.Option("--tasks", "-t", help="Comma-separated list of tasks to optimize"),
    ] = None,
) -> None:
    """Run prompt optimization for specified models."""
    config = load_config(config_path)

    if output_dir:
        config.output_dir = str(output_dir)

    model_list = [m.strip() for m in models.split(",")]
    task_list = None
    if tasks:
        task_list = [TaskType(t.strip()) for t in tasks.split(",")]

    for model_id in model_list:
        console.print(f"\n[bold blue]Optimizing prompts for {model_id}[/bold blue]")

        config.llm.model = model_id
        if "mock" in model_id.lower():
            config.llm.provider = "mock"
        elif ":" in model_id or any(p in model_id.lower() for p in ("qwen", "llama")):
            config.llm.provider = "ollama"

        console.print(f"  Provider: {config.llm.provider}")

        if task_list:
            for task_type in task_list:
                console.print(f"  [yellow]Task: {task_type.value}[/yellow]")
                result = run_optimization(
                    task_type=task_type,
                    config=config,
                    seed=seed,
                )
                _print_result(result)
                _save_single_result(result, config, seed)
        else:
            output = optimize_all_tasks(config, seed=seed)
            _print_output_summary(output)

    console.print(f"\n[green]Results saved to {config.output_dir}/[/green]")


@app.command()
def benchmark(
    model: Annotated[
        str,
        typer.Option("--model", "-m", help="Model ID to benchmark"),
    ] = "qwen3:0.6b",
    tasks: Annotated[
        str | None,
        typer.Option("--tasks", "-t", help="Comma-separated list of tasks to benchmark"),
    ] = None,
    num_examples: Annotated[
        int,
        typer.Option("--num", "-n", help="Number of examples per task"),
    ] = 20,
    config_path: Annotated[
        Path | None,
        typer.Option("--config", "-c", help="Path to config file"),
    ] = None,
) -> None:
    """Benchmark multiple prompt variants to find the best for each task."""
    config = load_config(config_path)
    config.llm.model = model

    if ":" in model or any(p in model.lower() for p in ("qwen", "llama")):
        config.llm.provider = "ollama"

    console.print(f"\n[bold]Benchmarking prompt variants with {model}[/bold]")
    console.print(f"Provider: {config.llm.provider}")
    console.print(f"Examples per task: {num_examples}\n")

    if tasks:
        task_list = [TaskType(t.strip()) for t in tasks.split(",")]
        results = {}
        for task_type in task_list:
            console.print(f"\n[bold blue]Benchmarking {task_type.value}[/bold blue]")
            results[task_type.value] = run_benchmark(task_type, config, num_examples)
    else:
        results = run_all_benchmarks(config, num_examples)

    print_benchmark_results(results)


def _print_result(result: OptimizationResult) -> None:
    """Print single optimization result."""
    console.print(f"    Score: [green]{result.val_score:.3f}[/green]")
    console.print(f"    Format Pass Rate: [green]{result.format_pass_rate:.1%}[/green]")
    console.print(f"    Metric Calls: {result.total_metric_calls}")


def _save_single_result(result: OptimizationResult, config: Config, seed: int) -> None:
    """Save single task optimization result to JSON and benchmark winners."""
    output_dir = Path(config.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    model_filename = config.llm.model.replace(":", "-").replace("/", "-")
    output_path = output_dir / f"{model_filename}_{result.task_type.value}.json"

    data = {
        "model": config.llm.model,
        "task": result.task_type.value,
        "best_prompt": {
            "system": result.best_candidate.system_prompt,
            "user": result.best_candidate.user_prompt,
        },
        "metrics": {
            "val_score": result.val_score,
            "format_pass_rate": result.format_pass_rate,
            "total_metric_calls": result.total_metric_calls,
        },
        "meta": {
            "seed": seed,
            "timestamp": datetime.now().isoformat(),
        },
    }

    with open(output_path, "w") as f:
        json.dump(data, f, indent=2)

    # Also save to benchmark winners
    save_winner(
        model_id=config.llm.model,
        task_type=result.task_type,
        system=result.best_candidate.system_prompt,
        user=result.best_candidate.user_prompt,
        score=result.val_score,
        format_pass_rate=result.format_pass_rate,
    )

    console.print(f"    [dim]Saved to {output_path}[/dim]")
    console.print(f"    [dim]Updated benchmark winner[/dim]")


def _print_output_summary(output: OutputJSON) -> None:
    """Print summary of optimization output."""
    table = Table(title=f"Optimization Results for {output.model}")
    table.add_column("Task", style="cyan")
    table.add_column("Val Score", justify="right")
    table.add_column("Format Pass Rate", justify="right")

    for task_name, task_scores in output.meta.scores.items():
        table.add_row(
            task_name,
            f"{task_scores.val_score:.3f}",
            f"{task_scores.format_pass_rate:.1%}",
        )

    console.print(table)


if __name__ == "__main__":
    app()
