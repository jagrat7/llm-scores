import argparse
import json
import os
from collections import defaultdict
from pathlib import Path
from urllib.request import Request, urlopen

import matplotlib.pyplot as plt
import seaborn as sns
from dotenv import load_dotenv
from matplotlib.colors import to_rgb
from matplotlib.ticker import FuncFormatter


DATA_URL = "https://deepswe.datacurve.ai/artifacts/v1.1/leaderboard-live.json"
AA_API_URL = "https://artificialanalysis.ai/api/v2/language/models/free"
OUTPUT_PATH = Path("deepswe-score-chart.png")
SPEED_OUTPUT_PATH = Path("deepswe-cost-vs-speed-chart.png")
FIGURE_SIZE = (14, 9)
BACKGROUND_COLOR = "#1d1d1d"
GRID_COLOR = "#666666"
TEXT_COLOR = "#f2f2f2"
MUTED_TEXT_COLOR = "#a3a3a3"
EFFORT_ORDER = {"low": 0, "medium": 1, "high": 2, "xhigh": 3, "max": 4}
MODEL_LABELS = {
    "gpt-5-6-sol": "GPT-5.6 Sol",
    "claude-fable-5": "Claude Fable 5",
    "claude-opus-4-8": "Claude Opus 4.8",
    "claude-sonnet-5": "Claude Sonnet 5",
    "kimi-k2-7-code": "Kimi K2.7",
}


def main():
    load_dotenv()
    parser = argparse.ArgumentParser(description="Generate the 3D DeepSWE chart")
    parser.add_argument("--show", action="store_true", help="Open the chart in a desktop window")
    args = parser.parse_args()
    aa_api_key = os.environ.get("AA_API_KEY")
    if not aa_api_key:
        parser.error("AA_API_KEY is not set")

    with urlopen(DATA_URL, timeout=20) as response:
        payload = json.load(response)

    aa_models = {}
    page = 1
    while True:
        request = Request(
            f"{AA_API_URL}?page={page}",
            headers={"x-api-key": aa_api_key},
        )
        with urlopen(request, timeout=20) as response:
            aa_payload = json.load(response)
        aa_models.update({model["slug"]: model for model in aa_payload["data"]})
        if not aa_payload["pagination"]["has_more"]:
            break
        page += 1

    series = defaultdict(list)
    for row in payload["rows"]:
        if row["model"] not in MODEL_LABELS:
            continue
        duration = row.get("mean_duration_seconds")
        output_tokens = row.get("mean_output_tokens")
        if not duration or output_tokens is None:
            continue
        effort = row.get("reasoning_effort") or "default"
        base_slug = row["model"]
        effort_slug = f"{base_slug}-{effort}" if effort not in {"default", "max"} else base_slug
        aa_model = aa_models.get(effort_slug) or aa_models.get(base_slug)
        throughput = aa_model.get("performance", {}).get("median_output_tokens_per_second") if aa_model else None
        if throughput is None:
            continue
        series[row["model"]].append(
            {
                "cost": row["mean_cost_usd"],
                "score": row["pass_rate"] * 100,
                "throughput": throughput,
                "effort": effort,
            }
        )
    series = {model: series[model] for model in MODEL_LABELS if model in series}

    sns.set_theme(style="darkgrid")
    figure = plt.figure(figsize=FIGURE_SIZE, facecolor=BACKGROUND_COLOR)
    ax = figure.add_subplot(111, projection="3d")
    ax.set_facecolor(BACKGROUND_COLOR)
    model_colors = dict(zip(series, sns.color_palette("husl", n_colors=len(series))))

    for model, points in series.items():
        points.sort(key=lambda point: EFFORT_ORDER.get(point["effort"], -1))
        costs = [point["cost"] for point in points]
        scores = [point["score"] for point in points]
        throughputs = [point["throughput"] for point in points]
        color = model_colors[model]
        ax.plot(costs, scores, throughputs, color=color, linewidth=1.8, alpha=0.8)
        ax.scatter(
            costs,
            scores,
            throughputs,
            color=color,
            edgecolor=TEXT_COLOR,
            linewidth=0.35,
            s=38,
            depthshade=False,
            label=MODEL_LABELS[model],
        )
        for point in points:
            ax.text(
                point["cost"],
                point["score"],
                point["throughput"] + 3,
                point["effort"].upper(),
                color=color,
                fontsize=6,
                fontweight="bold",
                ha="center",
                va="bottom",
            )

    all_points = [point for points in series.values() for point in points]
    max_cost = max(point["cost"] for point in all_points)
    max_score = max(point["score"] for point in all_points)
    max_throughput = max(point["throughput"] for point in all_points)
    ax.set_xlim(max_cost * 1.08, 0)
    ax.set_ylim(0, max_score * 1.08)
    ax.set_zlim(0, max_throughput * 1.1)
    ax.xaxis.set_major_formatter(FuncFormatter(lambda value, _: f"${value:.0f}" if value else "$0"))
    ax.yaxis.set_major_formatter(FuncFormatter(lambda value, _: f"{value:.0f}%"))
    ax.zaxis.set_major_formatter(FuncFormatter(lambda value, _: f"{value:.0f}"))
    ax.tick_params(colors=MUTED_TEXT_COLOR, labelsize=8)
    ax.grid(True)

    for axis in (ax.xaxis, ax.yaxis, ax.zaxis):
        axis.pane.set_facecolor(BACKGROUND_COLOR)
        axis.pane.set_edgecolor(GRID_COLOR)
        axis._axinfo["grid"]["color"] = (*to_rgb(GRID_COLOR), 0.35)

    ax.set_xlabel("Avg cost per task", color=TEXT_COLOR, fontsize=10, labelpad=10)
    ax.set_ylabel("DeepSWE score", color=TEXT_COLOR, fontsize=10, labelpad=10)
    ax.set_zlabel("Streaming output tokens/sec", color=TEXT_COLOR, fontsize=10, labelpad=12)
    ax.set_title("DeepSWE cost, score, and model throughput", color=TEXT_COLOR, fontsize=13, fontweight="bold")
    ax.set_box_aspect((1.45, 1, 1.15), zoom=1.18)
    ax.view_init(elev=23, azim=-40)
    legend = ax.legend(
        loc="upper left",
        bbox_to_anchor=(0.01, 0.98),
        title="Model key",
        facecolor=BACKGROUND_COLOR,
        edgecolor=GRID_COLOR,
        labelcolor=TEXT_COLOR,
        fontsize=6.5,
        title_fontsize=8,
        framealpha=0.92,
        borderpad=0.7,
        labelspacing=0.5,
        handletextpad=0.5,
    )
    legend.get_title().set_color(TEXT_COLOR)

    ax.set_position((0.02, 0.08, 0.92, 0.82))
    figure.text(
        0.96,
        0.025,
        f"DeepSWE v1.1 · {len(all_points)} points · throughput: Artificial Analysis API",
        color=MUTED_TEXT_COLOR,
        fontsize=7,
        ha="right",
    )
    figure.savefig(OUTPUT_PATH, dpi=180, facecolor=figure.get_facecolor())
    print(f"Chart saved to {OUTPUT_PATH.resolve()}")
    if args.show:
        plt.show()
    plt.close(figure)

    speed_figure, speed_ax = plt.subplots(figsize=(11, 7), facecolor=BACKGROUND_COLOR)
    speed_ax.set_facecolor(BACKGROUND_COLOR)
    for model, points in series.items():
        costs = [point["cost"] for point in points]
        throughputs = [point["throughput"] for point in points]
        color = model_colors[model]
        speed_ax.plot(costs, throughputs, color=color, linewidth=1.8, alpha=0.8)
        speed_ax.scatter(
            costs,
            throughputs,
            color=color,
            edgecolor=TEXT_COLOR,
            linewidth=0.35,
            s=42,
            label=MODEL_LABELS[model],
            zorder=3,
        )
        for point in points:
            speed_ax.annotate(
                point["effort"].upper(),
                (point["cost"], point["throughput"]),
                xytext=(4, 5),
                textcoords="offset points",
                color=color,
                fontsize=6,
                fontweight="bold",
            )

    speed_ax.set_xlim(max_cost * 1.08, 0)
    speed_ax.set_ylim(0, max_throughput * 1.1)
    speed_ax.xaxis.set_major_formatter(FuncFormatter(lambda value, _: f"${value:.0f}" if value else "$0"))
    speed_ax.yaxis.set_major_formatter(FuncFormatter(lambda value, _: f"{value:.0f}"))
    speed_ax.set_xlabel("Avg cost per task", color=TEXT_COLOR, fontsize=10, labelpad=10)
    speed_ax.set_ylabel("Streaming output tokens/sec", color=TEXT_COLOR, fontsize=10, labelpad=10)
    speed_ax.set_title("DeepSWE cost vs. model throughput", color=TEXT_COLOR, fontsize=13, fontweight="bold")
    speed_ax.tick_params(colors=MUTED_TEXT_COLOR, labelsize=8)
    speed_ax.grid(color=GRID_COLOR, linewidth=0.8, alpha=0.35)
    for spine in speed_ax.spines.values():
        spine.set_color(GRID_COLOR)
        spine.set_alpha(0.5)
    speed_legend = speed_ax.legend(
        loc="upper left",
        title="Model key",
        facecolor=BACKGROUND_COLOR,
        edgecolor=GRID_COLOR,
        labelcolor=TEXT_COLOR,
        fontsize=7,
        title_fontsize=8,
        framealpha=0.92,
    )
    speed_legend.get_title().set_color(TEXT_COLOR)
    speed_figure.tight_layout()
    speed_figure.savefig(SPEED_OUTPUT_PATH, dpi=180, facecolor=speed_figure.get_facecolor())
    print(f"Chart saved to {SPEED_OUTPUT_PATH.resolve()}")
    if args.show:
        plt.show()
    plt.close(speed_figure)


if __name__ == "__main__":
    main()
