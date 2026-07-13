# DeepSWE score chart

A 3D Seaborn/Matplotlib view of the complete DeepSWE v1.1 leaderboard: average task cost on the x-axis, DeepSWE score on the y-axis, and effective output throughput on the z-axis. Every model/effort result is a true `(x, y, z)` point, and points from the same model are connected through 3D space.

Generate the chart with:

```sh
uv run deepswe-score-chart.py
```

The image is written to `deepswe-score-chart.png`.

The script downloads the current [DeepSWE v1.1 leaderboard data](https://deepswe.datacurve.ai/artifacts/v1.1/leaderboard-live.json) when it runs. Effective throughput is calculated as `mean_output_tokens / mean_duration_seconds`, so it describes the complete coding-agent run rather than raw API streaming speed.

To also open it in a desktop window:

```sh
uv run deepswe-score-chart.py --show
```
