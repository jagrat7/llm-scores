import { useEffect, useMemo, useRef, useState } from "react"
import {
  CartesianGrid,
  ComposedChart,
  LabelList,
  Line,
  ResponsiveContainer,
  Scatter,
  XAxis,
  YAxis,
} from "recharts"

import type { Metric } from "#/lib/metrics"
import type { Model } from "#/lib/orpc-client"

import { DataState } from "#/components/data-state"
import { CHART_HEIGHT_CLASS } from "#/lib/layout-styles"
import { formatMetric, METRIC_CONFIG } from "#/lib/metrics"

type ChartPoint = Model & {
  id: string
  label: string
  pointIndex: number
  xValue: number
  yValue: number
  xMetric: Metric
  yMetric: Metric
}

type PointShapeProps = {
  activePointId: string | null
  cx?: number
  cy?: number
  fill?: string
  payload?: ChartPoint
  onActivate: (point: ChartPoint | null) => void
}

const CHART_MARGIN = { top: 38, right: 42, bottom: 38, left: 18 }
const Y_AXIS_WIDTH = 64
const LABEL_LINE_HEIGHT = 11
const LABEL_DOT_OFFSET = 16
const LABEL_COLLISION_GAP = 3

function PointLabel({
  index = 0,
  placement,
  value,
  x = 0,
  y = 0,
}: {
  index?: number
  placement: "top" | "bottom"
  value?: number | string
  x?: number | string
  y?: number | string
}) {
  if (value == null) return null

  const lines = String(value).split(" ")
  const xPosition = Number(x)
  const yPosition = Number(y)
  const resolvedPlacement = index % 2 === 0 ? placement : placement === "top" ? "bottom" : "top"
  const startY =
    resolvedPlacement === "bottom"
      ? yPosition + LABEL_DOT_OFFSET
      : yPosition - LABEL_DOT_OFFSET - (lines.length - 1) * LABEL_LINE_HEIGHT

  return (
    <text
      className="chart-point-label"
      x={xPosition}
      y={startY}
      fill="var(--foreground)"
      fontSize={10}
      pointerEvents="none"
      textAnchor="middle"
    >
      {lines.map((line, lineIndex) => (
        <tspan
          key={`${line}-${lineIndex}`}
          x={xPosition}
          dy={lineIndex === 0 ? 0 : LABEL_LINE_HEIGHT}
        >
          {line}
        </tspan>
      ))}
    </text>
  )
}

function InteractivePoint({
  activePointId,
  cx = 0,
  cy = 0,
  fill = "var(--foreground)",
  payload,
  onActivate,
}: PointShapeProps) {
  if (!payload) return <g />
  const point = payload
  const active = activePointId === point.id

  return (
    <g
      className="chart-point cursor-crosshair"
      data-chart-point={point.pointIndex}
      onPointerEnter={() => onActivate(point)}
      onPointerLeave={() => onActivate(null)}
      onClick={() => onActivate(point)}
      aria-hidden="true"
    >
      <circle cx={cx} cy={cy} r={22} fill="var(--background)" fillOpacity={0} pointerEvents="all" />
      <circle
        className="chart-point-dot"
        cx={cx}
        cy={cy}
        r={active ? 7 : 5}
        fill={fill}
        stroke={active ? "var(--ring)" : "var(--background)"}
        strokeWidth={active ? 3 : 2}
        pointerEvents="none"
      />
    </g>
  )
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
  const chartRef = useRef<HTMLDivElement>(null)
  const [activePoint, setActivePoint] = useState<ChartPoint | null>(null)
  const [reduceMotion, setReduceMotion] = useState(true)
  const { indexedPoints, series } = useMemo(() => {
    const xKey = METRIC_CONFIG[xMetric].dataKey
    const yKey = METRIC_CONFIG[yMetric].dataKey

    const points = models.flatMap((model) => {
      const xValue = model[xKey]
      const yValue = model[yKey]

      if (typeof xValue !== "number") return []
      if (typeof yValue !== "number") return []

      const effortLabel = model.effort === "default" ? "" : ` [${model.effort}]`

      return {
        ...model,
        id: `${model.model}-${model.effort}`,
        label: `${model.displayName}${effortLabel}`,
        pointIndex: 0,
        xValue,
        yValue,
        xMetric,
        yMetric,
      }
    })
    const pointsWithIndex = points.map((point, pointIndex) => ({
      ...point,
      pointIndex,
    }))
    const pointsByModel = new Map<string, Array<ChartPoint>>()

    for (const point of pointsWithIndex) {
      const seriesPoints = pointsByModel.get(point.model) ?? []
      seriesPoints.push(point)
      pointsByModel.set(point.model, seriesPoints)
    }

    const familyOccurrences = new Map<Model["family"], number>()
    const chartSeries = Array.from(pointsByModel.entries()).map(([model, seriesPoints]) => {
      const family = seriesPoints[0].family
      const familyOccurrence = familyOccurrences.get(family) ?? 0
      const labelPosition: "top" | "bottom" = familyOccurrence % 2 === 0 ? "top" : "bottom"
      familyOccurrences.set(family, familyOccurrence + 1)

      return {
        model,
        color: seriesPoints[0].chartColor,
        labelPosition,
        points: seriesPoints.toSorted((left, right) => left.effortOrder - right.effortOrder),
      }
    })

    return { indexedPoints: pointsWithIndex, series: chartSeries }
  }, [models, xMetric, yMetric])

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)")
    const update = () => setReduceMotion(media.matches)
    update()
    media.addEventListener("change", update)
    return () => media.removeEventListener("change", update)
  }, [])

  useEffect(() => {
    const chart = chartRef.current
    if (!chart) return undefined

    let animationFrame = 0
    let animationTimeout = 0
    const resolveLabelCollisions = () => {
      cancelAnimationFrame(animationFrame)
      animationFrame = requestAnimationFrame(() => {
        const labels = Array.from(chart.querySelectorAll<SVGTextElement>(".chart-point-label"))
        const visibleBounds: Array<DOMRect> = []

        for (const label of labels) label.style.visibility = "visible"

        for (const label of labels) {
          const bounds = label.getBoundingClientRect()
          const intersects = visibleBounds.some(
            (visible) =>
              bounds.left < visible.right + LABEL_COLLISION_GAP &&
              bounds.right > visible.left - LABEL_COLLISION_GAP &&
              bounds.top < visible.bottom + LABEL_COLLISION_GAP &&
              bounds.bottom > visible.top - LABEL_COLLISION_GAP,
          )

          label.style.visibility = intersects ? "hidden" : "visible"
          if (!intersects) visibleBounds.push(bounds)
        }
      })
    }
    const resizeObserver = new ResizeObserver(resolveLabelCollisions)
    const mutationObserver = new MutationObserver(resolveLabelCollisions)

    resizeObserver.observe(chart)
    mutationObserver.observe(chart, { childList: true, subtree: true })
    resolveLabelCollisions()
    void document.fonts.ready.then(resolveLabelCollisions)
    animationTimeout = window.setTimeout(resolveLabelCollisions, 240)

    return () => {
      resizeObserver.disconnect()
      mutationObserver.disconnect()
      cancelAnimationFrame(animationFrame)
      window.clearTimeout(animationTimeout)
    }
  }, [series])

  const modelCount = new Set(indexedPoints.map((point) => point.model)).size
  const modelNoun = modelCount === 1 ? "model" : "models"
  const variantNoun = indexedPoints.length === 1 ? "variant" : "variants"
  const chartLabel = `Scatter chart comparing ${modelCount} ${modelNoun} (${indexedPoints.length} effort ${variantNoun}) by ${METRIC_CONFIG[yMetric].label} versus ${METRIC_CONFIG[xMetric].label}. Use arrow keys to move between points.`

  function handlePointKeyDown(event: React.KeyboardEvent<HTMLButtonElement>, pointIndex: number) {
    const direction = ["ArrowRight", "ArrowDown"].includes(event.key)
      ? 1
      : ["ArrowLeft", "ArrowUp"].includes(event.key)
        ? -1
        : 0

    if (direction === 0) return

    event.preventDefault()
    const nextIndex = (pointIndex + direction + indexedPoints.length) % indexedPoints.length
    const nextPoint = document.querySelector<HTMLButtonElement>(
      `[data-chart-keyboard-point="${nextIndex}"]`,
    )
    nextPoint?.focus()
  }

  if (indexedPoints.length === 0) {
    return (
      <DataState className={CHART_HEIGHT_CLASS}>No models have both selected metrics</DataState>
    )
  }

  return (
    <div
      ref={chartRef}
      className={`relative w-full ${CHART_HEIGHT_CLASS}`}
      data-chart-frame="loaded"
    >
      <span role="img" aria-label={chartLabel} className="sr-only" />
      <ResponsiveContainer
        width="100%"
        height="100%"
        initialDimension={{ width: 1200, height: 700 }}
      >
        <ComposedChart margin={CHART_MARGIN} accessibilityLayer={false}>
          <CartesianGrid stroke="var(--border)" strokeOpacity={0.65} vertical={false} />
          <XAxis
            type="number"
            dataKey="xValue"
            name={METRIC_CONFIG[xMetric].label}
            domain={["auto", "auto"]}
            tickFormatter={(value) => formatMetric(Number(value), xMetric)}
            tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
            tickLine={{ stroke: "var(--border)" }}
            axisLine={{ stroke: "var(--border)" }}
            label={{
              value: `${METRIC_CONFIG[xMetric].label} · ${METRIC_CONFIG[xMetric].unit}`,
              position: "insideBottom",
              offset: -24,
              fill: "var(--muted-foreground)",
              fontSize: 11,
            }}
          />
          <YAxis
            type="number"
            dataKey="yValue"
            name={METRIC_CONFIG[yMetric].label}
            domain={["auto", "auto"]}
            tickFormatter={(value) => formatMetric(Number(value), yMetric)}
            tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
            tickLine={{ stroke: "var(--border)" }}
            axisLine={{ stroke: "var(--border)" }}
            width={Y_AXIS_WIDTH}
            label={{
              value: `${METRIC_CONFIG[yMetric].label} · ${METRIC_CONFIG[yMetric].unit}`,
              angle: -90,
              position: "insideLeft",
              fill: "var(--muted-foreground)",
              fontSize: 11,
            }}
          />
          {series.map((modelSeries) => (
            <Line
              key={`line-${modelSeries.model}`}
              data={modelSeries.points}
              dataKey="yValue"
              stroke={modelSeries.color}
              strokeWidth={1.25}
              strokeOpacity={0.45}
              dot={false}
              activeDot={false}
              isAnimationActive={!reduceMotion}
              animationDuration={220}
              animationEasing="ease-out"
            />
          ))}
          {series.map((modelSeries) => (
            <Scatter
              key={`points-${modelSeries.model}`}
              data={modelSeries.points}
              fill={modelSeries.color}
              isAnimationActive={!reduceMotion}
              animationDuration={220}
              animationEasing="ease-out"
              shape={
                <InteractivePoint
                  activePointId={activePoint?.id ?? null}
                  onActivate={setActivePoint}
                />
              }
            >
              <LabelList
                dataKey="label"
                content={<PointLabel placement={modelSeries.labelPosition} />}
              />
            </Scatter>
          ))}
        </ComposedChart>
      </ResponsiveContainer>
      <div className="sr-only" aria-label="Chart points" role="group">
        {indexedPoints.map((point) => (
          <button
            key={point.id}
            type="button"
            tabIndex={point.pointIndex === 0 ? 0 : -1}
            data-chart-keyboard-point={point.pointIndex}
            aria-label={`${point.label}, ${METRIC_CONFIG[point.xMetric].label} ${formatMetric(point.xValue, point.xMetric)}, ${METRIC_CONFIG[point.yMetric].label} ${formatMetric(point.yValue, point.yMetric)}`}
            onFocus={() => setActivePoint(point)}
            onBlur={() => setActivePoint(null)}
            onClick={() => setActivePoint(point)}
            onKeyDown={(event) => handlePointKeyDown(event, point.pointIndex)}
          >
            {point.label}
          </button>
        ))}
      </div>
      <div
        aria-hidden={activePoint == null}
        aria-live="polite"
        className={`border-border bg-popover text-popover-foreground pointer-events-none absolute top-3 right-3 max-w-[calc(100%-1.5rem)] min-w-56 rounded-md border p-3 text-xs transition-opacity duration-200 ease-out ${
          activePoint == null ? "opacity-0" : "opacity-100"
        }`}
      >
        {activePoint ? (
          <>
            <div className="mb-2 font-medium">{activePoint.displayName}</div>
            <div className="text-muted-foreground mb-2">Effort: {activePoint.effort}</div>
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5">
              <dt>{METRIC_CONFIG[xMetric].label}</dt>
              <dd className="text-right font-medium">
                {formatMetric(activePoint.xValue, xMetric)}
                <span className="text-muted-foreground ml-1">
                  [{activePoint.sources[METRIC_CONFIG[xMetric].dataKey] === "DeepSWE" ? "D" : "AA"}]
                </span>
              </dd>
              <dt>{METRIC_CONFIG[yMetric].label}</dt>
              <dd className="text-right font-medium">
                {formatMetric(activePoint.yValue, yMetric)}
                <span className="text-muted-foreground ml-1">
                  [{activePoint.sources[METRIC_CONFIG[yMetric].dataKey] === "DeepSWE" ? "D" : "AA"}]
                </span>
              </dd>
            </dl>
            <div className="border-border text-muted-foreground mt-2 border-t pt-2 text-xs">
              D DeepSWE · AA Artificial Analysis
            </div>
          </>
        ) : null}
      </div>
    </div>
  )
}
