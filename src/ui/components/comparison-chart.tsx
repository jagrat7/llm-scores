import { AxisBottom, AxisLeft } from "@visx/axis"
import { GridColumns, GridRows } from "@visx/grid"
import { Group } from "@visx/group"
import { useParentSize } from "@visx/responsive"
import { scaleLinear } from "@visx/scale"
import { motion } from "motion/react"
import { useEffect, useMemo, useState } from "react"

import type { Metric } from "#/ui/lib/metrics"
import type { Model } from "#/ui/lib/orpc-client"
import type { PlotData, PlotPoint } from "#/ui/lib/comparison-plot-data"

import { DataState } from "#/ui/components/data-state"
import { PointDetails, SOURCE_LEGEND } from "#/ui/components/point-details"
import {
  CHART_ACTIVE_SCALE,
  CHART_AXIS_TITLE_SIZE,
  CHART_EASE,
  CHART_GRID_MINOR_OPACITY,
  CHART_GRID_OPACITY,
  CHART_POINT_LABEL_SIZE,
  CHART_TICK_SIZE,
  CHART_TOOLTIP_GAP,
  CHART_TOOLTIP_WIDTH,
} from "#/ui/lib/chart-styles"
import {
  buildPlotData,
  describeCoverage,
  describePlot,
  padDomain,
} from "#/ui/lib/comparison-plot-data"
import { CHART_HEIGHT_CLASS } from "#/ui/lib/layout-styles"
import { formatMetric, METRIC_CONFIG } from "#/ui/lib/metrics"
import { useReducedMotion } from "#/ui/lib/use-reduced-motion"

type Position = { x: number; y: number }

type LabelPlacement = Position & { anchor: "middle"; visible: boolean }

const MARGIN = { top: 26, right: 30, bottom: 54, left: 74 }
const DOMAIN_PAD = 0.08
const POINT_RADIUS = 5
const ACTIVE_POINT_RADIUS = POINT_RADIUS * CHART_ACTIVE_SCALE
/** Pointer distance at which the nearest point stops being considered hovered. */
const HOVER_RADIUS = 110
const LABEL_FONT_SIZE = CHART_POINT_LABEL_SIZE
/** Average glyph width as a share of the font size — enough to reserve label boxes. */
const LABEL_WIDTH_RATIO = 0.56
const LABEL_OFFSET = 13
const LABEL_GAP = 4
const LABEL_MIN_WIDTH = 720
const AXIS_TICK_PROPS = {
  fill: "var(--muted-foreground)",
  fontSize: CHART_TICK_SIZE,
  fontFamily: "inherit",
} as const
const STAGGER_STEP = 0.012
const STAGGER_MAX = 0.28
const ENTRANCE_WINDOW = 900
/** Minimum pixels between ticks — larger spacing means fewer, calmer axis markers. */
const TICK_SPACING_X = 220
const TICK_SPACING_Y = 120

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function seriesPath(points: Array<PlotPoint>, positions: Map<string, Position>) {
  return points
    .map((point, index) => {
      const position = positions.get(point.id)

      if (!position) return ""

      return `${index === 0 ? "M" : "L"}${position.x.toFixed(2)} ${position.y.toFixed(2)}`
    })
    .join(" ")
}

/**
 * Greedy label placement in plot space. Points come in score order, so the strongest
 * models win a label and weaker overlaps are dropped. Boxes are estimated from the
 * glyph ratio rather than measured, which keeps this out of the DOM entirely.
 */
function placeLabels(
  data: PlotData,
  positions: Map<string, Position>,
  innerWidth: number,
  innerHeight: number,
) {
  const placements = new Map<string, LabelPlacement>()

  if (innerWidth < LABEL_MIN_WIDTH) return placements

  const preferred = new Map<string, "top" | "bottom">()

  for (const series of data.series) {
    for (const point of series.points) preferred.set(point.id, series.labelPlacement)
  }

  const taken: Array<{ left: number; right: number; top: number; bottom: number }> = []

  for (const point of data.points) {
    const position = positions.get(point.id)

    if (!position) continue

    const width = point.label.length * LABEL_FONT_SIZE * LABEL_WIDTH_RATIO
    const half = width / 2
    const centerX = clamp(position.x, half + 2, Math.max(half + 2, innerWidth - half - 2))
    const first = preferred.get(point.id) ?? "top"
    const order: Array<"top" | "bottom"> = first === "top" ? ["top", "bottom"] : ["bottom", "top"]
    let placed = false

    for (const side of order) {
      const baseline =
        side === "top" ? position.y - LABEL_OFFSET : position.y + LABEL_OFFSET + LABEL_FONT_SIZE
      const box = {
        left: centerX - half,
        right: centerX + half,
        top: baseline - LABEL_FONT_SIZE,
        bottom: baseline + 2,
      }

      if (box.top < 0 || box.bottom > innerHeight) continue

      const collides = taken.some(
        (other) =>
          box.left < other.right + LABEL_GAP &&
          box.right > other.left - LABEL_GAP &&
          box.top < other.bottom + LABEL_GAP &&
          box.bottom > other.top - LABEL_GAP,
      )

      if (collides) continue

      taken.push(box)
      placements.set(point.id, { x: centerX, y: baseline, anchor: "middle", visible: true })
      placed = true
      break
    }

    if (!placed) placements.set(point.id, { ...position, anchor: "middle", visible: false })
  }

  return placements
}

export function ComparisonChart({
  models,
  xMetric,
  yMetric,
}: {
  models: Array<Model>
  xMetric: Metric
  yMetric: Metric
}) {
  const { parentRef, width, height } = useParentSize({
    debounceTime: 24,
    initialSize: { width: 1200, height: 640 },
  })
  const reduceMotion = useReducedMotion()
  const [activeId, setActiveId] = useState<string | null>(null)
  const [entered, setEntered] = useState(false)
  const data = useMemo(
    () => buildPlotData(models, { x: xMetric, y: yMetric }),
    [models, xMetric, yMetric],
  )

  // Held until the staggered entrance has played out, so later moves start immediately.
  useEffect(() => {
    const timeout = window.setTimeout(() => setEntered(true), ENTRANCE_WINDOW)

    return () => window.clearTimeout(timeout)
  }, [])

  const layout = useMemo(() => {
    const innerWidth = Math.max(0, width - MARGIN.left - MARGIN.right)
    const innerHeight = Math.max(0, height - MARGIN.top - MARGIN.bottom)
    const xDomain = padDomain(data.domains.x, DOMAIN_PAD)
    const yDomain = padDomain(data.domains.y, DOMAIN_PAD)
    const xScale = scaleLinear<number>({
      domain: [xDomain.min, xDomain.max],
      range: [0, innerWidth],
      nice: true,
    })
    const yScale = scaleLinear<number>({
      domain: [yDomain.min, yDomain.max],
      range: [innerHeight, 0],
      nice: true,
    })
    const positions = new Map<string, Position>()

    for (const point of data.points) {
      positions.set(point.id, { x: xScale(point.values.x), y: yScale(point.values.y) })
    }

    return {
      innerWidth,
      innerHeight,
      xScale,
      yScale,
      xTicks: Math.max(2, Math.round(innerWidth / TICK_SPACING_X)),
      yTicks: Math.max(2, Math.round(innerHeight / TICK_SPACING_Y)),
      positions,
      paths: data.series.map((series) => ({
        key: series.key,
        color: series.color,
        ids: new Set(series.points.map((point) => point.id)),
        d: seriesPath(series.points, positions),
      })),
      labels: placeLabels(data, positions, innerWidth, innerHeight),
    }
  }, [data, height, width])

  const activePoint = activeId == null ? null : (data.pointById.get(activeId) ?? null)
  const activePosition = activeId == null ? null : (layout.positions.get(activeId) ?? null)
  const ready = layout.innerWidth > 0 && layout.innerHeight > 0
  const pinTooltip = width < 640
  const transition = { duration: reduceMotion ? 0 : 0.42, ease: CHART_EASE }

  function nearestPoint(event: React.PointerEvent<SVGRectElement>) {
    const bounds = event.currentTarget.getBoundingClientRect()
    const pointerX = event.clientX - bounds.left
    const pointerY = event.clientY - bounds.top
    let closestId: string | null = null
    let closestDistance = HOVER_RADIUS * HOVER_RADIUS

    for (const point of data.points) {
      const position = layout.positions.get(point.id)

      if (!position) continue

      const distance = (position.x - pointerX) ** 2 + (position.y - pointerY) ** 2

      if (distance < closestDistance) {
        closestDistance = distance
        closestId = point.id
      }
    }

    return closestId
  }

  function handlePointerMove(event: React.PointerEvent<SVGRectElement>) {
    const nextId = nearestPoint(event)

    if (nextId !== activeId) setActiveId(nextId)
  }

  function handlePointKeyDown(event: React.KeyboardEvent<HTMLButtonElement>, index: number) {
    const direction = ["ArrowRight", "ArrowDown"].includes(event.key)
      ? 1
      : ["ArrowLeft", "ArrowUp"].includes(event.key)
        ? -1
        : 0

    if (direction === 0) return

    event.preventDefault()
    const nextIndex = (index + direction + data.points.length) % data.points.length

    document.querySelector<HTMLButtonElement>(`[data-chart-keyboard-point="${nextIndex}"]`)?.focus()
  }

  if (data.points.length === 0) {
    return (
      <DataState className={CHART_HEIGHT_CLASS}>No models have both selected metrics</DataState>
    )
  }

  return (
    <div
      ref={parentRef}
      className={`relative w-full ${CHART_HEIGHT_CLASS}`}
      data-chart-frame="loaded"
    >
      <span role="img" aria-label={describePlot(data)} className="sr-only" />

      {ready ? (
        <svg width={width} height={height} className="block overflow-visible">
          <Group left={MARGIN.left} top={MARGIN.top}>
            <GridRows
              scale={layout.yScale}
              width={layout.innerWidth}
              numTicks={layout.yTicks}
              stroke="var(--border)"
              strokeOpacity={CHART_GRID_OPACITY}
            />
            <GridColumns
              scale={layout.xScale}
              height={layout.innerHeight}
              numTicks={layout.xTicks}
              stroke="var(--border)"
              strokeOpacity={CHART_GRID_MINOR_OPACITY}
            />

            {activePosition ? (
              <g className="pointer-events-none" aria-hidden="true">
                <line
                  x1={0}
                  x2={activePosition.x}
                  y1={activePosition.y}
                  y2={activePosition.y}
                  stroke="var(--muted-foreground)"
                  strokeOpacity={0.45}
                  strokeDasharray="3 4"
                />
                <line
                  x1={activePosition.x}
                  x2={activePosition.x}
                  y1={activePosition.y}
                  y2={layout.innerHeight}
                  stroke="var(--muted-foreground)"
                  strokeOpacity={0.45}
                  strokeDasharray="3 4"
                />
              </g>
            ) : null}

            <g aria-hidden="true" fill="none" strokeLinecap="round" strokeLinejoin="round">
              {layout.paths.map((path) => (
                <motion.path
                  key={path.key}
                  d={path.d}
                  stroke={path.color}
                  strokeWidth={2}
                  initial={reduceMotion ? false : { opacity: 0 }}
                  animate={{
                    d: path.d,
                    opacity: activeId == null || path.ids.has(activeId) ? 0.5 : 0.16,
                  }}
                  transition={transition}
                />
              ))}
            </g>

            <g aria-hidden="true">
              {data.points.map((point) => {
                const position = layout.positions.get(point.id)

                if (!position) return null

                const active = point.id === activeId
                const dimmed = activeId != null && !active

                return (
                  <motion.circle
                    key={point.id}
                    cx={position.x}
                    cy={position.y}
                    fill={point.color}
                    stroke="var(--background)"
                    strokeWidth={2}
                    initial={reduceMotion ? false : { r: 0, opacity: 0 }}
                    animate={{
                      cx: position.x,
                      cy: position.y,
                      r: active ? ACTIVE_POINT_RADIUS : POINT_RADIUS,
                      opacity: dimmed ? 0.42 : 1,
                    }}
                    transition={{
                      ...transition,
                      delay:
                        entered || reduceMotion
                          ? 0
                          : Math.min(point.index * STAGGER_STEP, STAGGER_MAX),
                    }}
                  />
                )
              })}
            </g>

            {activePosition ? (
              <circle
                aria-hidden="true"
                className="pointer-events-none"
                cx={activePosition.x}
                cy={activePosition.y}
                r={ACTIVE_POINT_RADIUS + 6}
                fill="none"
                stroke="var(--ring)"
                strokeOpacity={0.5}
                strokeWidth={1.5}
              />
            ) : null}

            <g aria-hidden="true">
              {data.points.map((point) => {
                const placement = layout.labels.get(point.id)

                if (!placement) return null

                const active = point.id === activeId

                return (
                  <text
                    key={point.id}
                    x={placement.x}
                    y={placement.y}
                    textAnchor={placement.anchor}
                    fontSize={LABEL_FONT_SIZE}
                    fontWeight={active ? 600 : 500}
                    fill="var(--foreground)"
                    stroke="var(--background)"
                    strokeWidth={3}
                    paintOrder="stroke"
                    opacity={placement.visible ? (activeId == null || active ? 1 : 0.35) : 0}
                    style={{ transition: reduceMotion ? undefined : "opacity 200ms ease-out" }}
                  >
                    {point.label}
                  </text>
                )
              })}
            </g>

            <AxisLeft
              scale={layout.yScale}
              numTicks={layout.yTicks}
              stroke="var(--border)"
              tickStroke="var(--border)"
              tickFormat={(value) => formatMetric(Number(value), yMetric)}
              tickLabelProps={() => ({ ...AXIS_TICK_PROPS, dx: -4, dy: 3, textAnchor: "end" })}
            />
            <AxisBottom
              top={layout.innerHeight}
              scale={layout.xScale}
              numTicks={layout.xTicks}
              stroke="var(--border)"
              tickStroke="var(--border)"
              tickFormat={(value) => formatMetric(Number(value), xMetric)}
              tickLabelProps={() => ({ ...AXIS_TICK_PROPS, dy: 2, textAnchor: "middle" })}
            />

            <rect
              x={0}
              y={0}
              width={layout.innerWidth}
              height={layout.innerHeight}
              fill="transparent"
              className="cursor-crosshair"
              onPointerMove={handlePointerMove}
              onPointerDown={handlePointerMove}
              onPointerLeave={() => setActiveId(null)}
            />
          </Group>

          <text
            x={MARGIN.left + layout.innerWidth / 2}
            y={height - 10}
            textAnchor="middle"
            fill="var(--muted-foreground)"
            fontSize={CHART_AXIS_TITLE_SIZE}
            fontWeight={500}
          >
            {METRIC_CONFIG[xMetric].label} · {METRIC_CONFIG[xMetric].unit}
          </text>
          <text
            transform={`translate(16 ${MARGIN.top + layout.innerHeight / 2}) rotate(-90)`}
            textAnchor="middle"
            fill="var(--muted-foreground)"
            fontSize={CHART_AXIS_TITLE_SIZE}
            fontWeight={500}
          >
            {METRIC_CONFIG[yMetric].label} · {METRIC_CONFIG[yMetric].unit}
          </text>
          {/* Shares the axis-title baseline so the two read as one band. */}
          {pinTooltip ? null : (
            <text
              x={width - 8}
              y={height - 10}
              textAnchor="end"
              fill="var(--muted-foreground)"
              fontSize={CHART_TICK_SIZE}
            >
              {describeCoverage(data, models.length)}
            </text>
          )}
        </svg>
      ) : null}

      <div
        aria-hidden={activePoint == null}
        className={`border-border bg-popover text-popover-foreground pointer-events-none absolute z-10 rounded-lg border p-3 shadow-lg transition-opacity duration-150 ease-out ${
          activePoint == null ? "opacity-0" : "opacity-100"
        }`}
        style={
          pinTooltip || !activePosition
            ? { top: 12, right: 12, width: CHART_TOOLTIP_WIDTH }
            : {
                width: CHART_TOOLTIP_WIDTH,
                // Flips to the inside edge so the card never leaves the plot frame.
                left: clamp(
                  MARGIN.left +
                    activePosition.x +
                    (activePosition.x > layout.innerWidth / 2
                      ? -(CHART_TOOLTIP_WIDTH + CHART_TOOLTIP_GAP)
                      : CHART_TOOLTIP_GAP),
                  8,
                  Math.max(8, width - CHART_TOOLTIP_WIDTH - 8),
                ),
                top: clamp(MARGIN.top + activePosition.y - 60, 8, Math.max(8, height - 168)),
              }
        }
      >
        {activePoint ? (
          <>
            <PointDetails axes={data.axes} metrics={data.metrics} point={activePoint} />
            <p className="border-border text-muted-foreground mt-3 border-t pt-2 text-[0.6875rem]">
              {SOURCE_LEGEND}
            </p>
          </>
        ) : null}
      </div>

      <div className="sr-only" aria-label="Chart points" role="group">
        {data.points.map((point) => (
          <button
            key={point.id}
            type="button"
            tabIndex={point.index === 0 ? 0 : -1}
            data-chart-keyboard-point={point.index}
            aria-label={`${point.label}, ${METRIC_CONFIG[xMetric].label} ${formatMetric(point.values.x, xMetric)}, ${METRIC_CONFIG[yMetric].label} ${formatMetric(point.values.y, yMetric)}`}
            onFocus={() => setActiveId(point.id)}
            onBlur={() => setActiveId(null)}
            onClick={() => setActiveId(point.id)}
            onKeyDown={(event) => handlePointKeyDown(event, point.index)}
          >
            {point.label}
          </button>
        ))}
      </div>

      <p aria-live="polite" className="sr-only">
        {activePoint ? `${activePoint.label} selected` : ""}
      </p>
    </div>
  )
}
