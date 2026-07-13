import argparse
import json
from collections import defaultdict
from pathlib import Path
from urllib.request import urlopen

import matplotlib.pyplot as plt
import seaborn as sns
from matplotlib.colors import to_rgb
from matplotlib.ticker import FuncFormatter


DATA_URL = "https://deepswe.datacurve.ai/artifacts/v1.1/leaderboard-live.json"
OUTPUT_PATH = Path("deepswe-score-chart.png")
FIGURE_SIZE = (14, 9)
BACKGROUND_COLOR = "#1d1d1d"
GRID_COLOR = "#666666"
TEXT_COLOR = "#f2f2f2"
MUTED_TEXT_COLOR = "#a3a3a3"
EFFORT_ORDER = {"low": 0, "medium": 1, "high": 2, "xhigh": 3, "max": 4}
EXCLUDED_MODELS = {
    "claude-sonnet-4-6",
    "gpt-5-4",
    "gpt-5-6-luna",
    "kimi-k2-7-code",
}


def main():
    parser = argparse.ArgumentParser(description="Generate the 3D DeepSWE chart")
    parser.add_argument("--show", action="store_true", help="Open the chart in a desktop window")
    args = parser.parse_args()

    with urlopen(DATA_URL, timeout=20) as response:
        payload = json.load(response)

    series = defaultdict(list)
    for row in payload["rows"]:
        if row["model"] in EXCLUDED_MODELS:
            continue
        duration = row.get("mean_duration_seconds")
        output_tokens = row.get("mean_output_tokens")
        if not duration or output_tokens is None:
            continue
        series[row["model"]].append(
            {
                "cost": row["mean_cost_usd"],
                "score": row["pass_rate"] * 100,
                "throughput": output_tokens / duration,
                "effort": row.get("reasoning_effort") or "default",
            }
        )

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
            label=model,
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
    ax.set_zlabel("Effective output tokens/sec", color=TEXT_COLOR, fontsize=10, labelpad=12)
    ax.set_title("DeepSWE cost, score, and effective throughput", color=TEXT_COLOR, fontsize=13, fontweight="bold")
    ax.set_box_aspect((1.45, 1, 1.15), zoom=1.18)
    ax.view_init(elev=23, azim=-60)
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
        f"DeepSWE v1.1 · {len(all_points)} points · effective throughput = mean output tokens / mean duration",
        color=MUTED_TEXT_COLOR,
        fontsize=7,
        ha="right",
    )
    figure.savefig(OUTPUT_PATH, dpi=180, facecolor=figure.get_facecolor())
    print(f"Chart saved to {OUTPUT_PATH.resolve()}")
    if args.show:
        plt.show()
    plt.close(figure)


if __name__ == "__main__":
    main()
