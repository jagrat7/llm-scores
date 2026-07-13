# DeepSWE score chart

A 3D Seaborn/Matplotlib view of selected DeepSWE v1.1 leaderboard models: average task cost on the x-axis, DeepSWE score on the y-axis, and measured API streaming throughput on the z-axis. Every model/effort result is a true `(x, y, z)` point, and points from the same model are connected through 3D space.

Generate the chart with:

```sh
cp .env.example .env
# Add your Artificial Analysis key to .env
uv run deepswe-score-chart.py
```

The script writes two images:

- `deepswe-score-chart.png` — 3D cost, score, and throughput
- `deepswe-cost-vs-speed-chart.png` — 2D cost versus throughput

The script downloads cost and score from the current [DeepSWE v1.1 leaderboard](https://deepswe.datacurve.ai/artifacts/v1.1/leaderboard-live.json). It retrieves median streaming output tokens per second from the [Artificial Analysis API](https://artificialanalysis.ai/data-api/docs). Artificial Analysis attribution is required by its API terms.

To also open it in a desktop window:

```sh
uv run deepswe-score-chart.py --show
```
