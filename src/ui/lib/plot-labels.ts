import type { PlotData, PlotPoint, PlotSeries } from "#/ui/lib/comparison-plot-data"

import { CHART_POINT_LABEL_SIZE } from "#/ui/lib/chart-styles"

/**
 * One annotation per model, pinned to the run's anchor effort: the model name over a
 * small effort tier. Both renderers build their labels from here so a model reads the
 * same whether it has one effort variant or five.
 */
export type SeriesLabel = {
  key: string
  /** Point the label hangs off — `PlotSeries.anchorId`. */
  pointId: string
  name: string
  /** Effort tier shown beneath the name; null when the model exposes no efforts. */
  effort: string | null
  color: string
  /** Every point of the run, so hovering any of them keeps the label lit. */
  ids: Set<string>
}

export const LABEL_NAME_SIZE = CHART_POINT_LABEL_SIZE + 0.5
export const LABEL_EFFORT_SIZE = CHART_POINT_LABEL_SIZE - 1.5
/** Baseline-to-baseline slack between the name and its effort line. */
export const LABEL_LINE_GAP = 1
/** Distance from the anchor dot to the nearest edge of the label block. */
export const LABEL_PIN_GAP = 9
/** Breathing room enforced between two placed label boxes. */
export const LABEL_COLLISION_GAP = 4
/** Average glyph width as a share of the font size — enough to reserve label boxes. */
export const LABEL_WIDTH_RATIO = 0.56

function seriesLabelAt(series: PlotSeries, anchor: PlotPoint): SeriesLabel {
  return {
    key: series.key,
    pointId: anchor.id,
    name: series.label,
    effort: anchor.model.effort === "default" ? null : anchor.model.effort.toUpperCase(),
    color: series.color,
    ids: new Set(series.points.map((point) => point.id)),
  }
}

function anchorOf(series: PlotSeries) {
  return series.points.find((point) => point.id === series.anchorId) ?? series.points[0]
}

export function buildSeriesLabels(data: PlotData): Array<SeriesLabel> {
  return data.series.map((series) => seriesLabelAt(series, anchorOf(series)))
}

/**
 * Fallback anchors for one run: the shared effort tier first, then outwards one effort
 * level at a time, stepping up before down. A renderer walks these when the preferred
 * point has no free space, so a crowded corner labels the neighbouring effort of the
 * same model rather than stacking two names on one dot.
 */
export function seriesLabelCandidates(series: PlotSeries): Array<SeriesLabel> {
  const anchor = anchorOf(series)
  const rest = series.points
    .filter((point) => point.id !== anchor.id)
    .toSorted((left, right) => {
      const leftStep = left.model.effortOrder - anchor.model.effortOrder
      const rightStep = right.model.effortOrder - anchor.model.effortOrder

      return Math.abs(leftStep) - Math.abs(rightStep) || rightStep - leftStep
    })

  return [anchor, ...rest].map((point) => seriesLabelAt(series, point))
}

/** Estimated block size, glyph-ratio based so neither renderer has to measure text. */
export function labelBlockSize(label: SeriesLabel) {
  const nameWidth = label.name.length * LABEL_NAME_SIZE * LABEL_WIDTH_RATIO
  const effortWidth =
    label.effort == null ? 0 : label.effort.length * LABEL_EFFORT_SIZE * LABEL_WIDTH_RATIO

  return {
    width: Math.max(nameWidth, effortWidth),
    height:
      label.effort == null ? LABEL_NAME_SIZE : LABEL_NAME_SIZE + LABEL_LINE_GAP + LABEL_EFFORT_SIZE,
  }
}
