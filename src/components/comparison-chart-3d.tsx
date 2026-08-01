import { Rotate3D } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'

import type { Metric } from '#/lib/metrics'
import type { JoinedModel } from '#/shared/models'

import { FAMILY_CHART_COLORS } from '#/shared/model-config'
import { INTERACTIVE_SURFACE_CLASS, MOBILE_TOUCH_TARGET_CLASS } from '#/lib/interaction-styles'
import { formatMetric, METRIC_CONFIG } from '#/lib/metrics'

type Rotation = {
  pitch: number
  yaw: number
}

type Coordinate = {
  x: number
  y: number
  z: number
}

type ProjectedCoordinate = Coordinate & {
  depth: number
  scale: number
}

type PlotPoint = JoinedModel & {
  id: string
  label: string
  values: Record<'x' | 'y' | 'z', number>
  coordinate: Coordinate
  projected: ProjectedCoordinate
}

type AxisName = 'x' | 'y' | 'z'

const VIEW_WIDTH = 960
const VIEW_HEIGHT = 620
const PLOT_CENTER = { x: VIEW_WIDTH / 2, y: VIEW_HEIGHT / 2 + 12 }
const PLOT_SCALE = 420
const CUBE_MIN = -0.5
const CUBE_MAX = 0.5
const PERSPECTIVE_STRENGTH = 0.35
const DEFAULT_ROTATION = { pitch: -0.42, yaw: -0.72 }
const VIEW_PRESETS: Record<string, Rotation> = {
  Perspective: DEFAULT_ROTATION,
  Front: { pitch: 0, yaw: 0 },
  Top: { pitch: -Math.PI / 2, yaw: 0 },
}
const AXES: Array<AxisName> = ['x', 'y', 'z']
const CUBE_VERTICES: Array<Coordinate> = [
  { x: CUBE_MIN, y: CUBE_MIN, z: CUBE_MIN },
  { x: CUBE_MAX, y: CUBE_MIN, z: CUBE_MIN },
  { x: CUBE_MAX, y: CUBE_MAX, z: CUBE_MIN },
  { x: CUBE_MIN, y: CUBE_MAX, z: CUBE_MIN },
  { x: CUBE_MIN, y: CUBE_MIN, z: CUBE_MAX },
  { x: CUBE_MAX, y: CUBE_MIN, z: CUBE_MAX },
  { x: CUBE_MAX, y: CUBE_MAX, z: CUBE_MAX },
  { x: CUBE_MIN, y: CUBE_MAX, z: CUBE_MAX },
]
const CUBE_EDGES = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 0],
  [4, 5],
  [5, 6],
  [6, 7],
  [7, 4],
  [0, 4],
  [1, 5],
  [2, 6],
  [3, 7],
] as const
const AXIS_ENDPOINTS: Record<AxisName, Coordinate> = {
  x: { x: CUBE_MAX + 0.14, y: CUBE_MIN, z: CUBE_MIN },
  y: { x: CUBE_MIN, y: CUBE_MAX + 0.14, z: CUBE_MIN },
  z: { x: CUBE_MIN, y: CUBE_MIN, z: CUBE_MAX + 0.14 },
}
const GRID_STEPS = [-0.25, 0, 0.25]

function getProjection(coordinate: Coordinate, rotation: Rotation): ProjectedCoordinate {
  const cosYaw = Math.cos(rotation.yaw)
  const sinYaw = Math.sin(rotation.yaw)
  const cosPitch = Math.cos(rotation.pitch)
  const sinPitch = Math.sin(rotation.pitch)
  const rotatedX = coordinate.x * cosYaw - coordinate.z * sinYaw
  const rotatedZ = coordinate.x * sinYaw + coordinate.z * cosYaw
  const rotatedY = coordinate.y * cosPitch - rotatedZ * sinPitch
  const depth = coordinate.y * sinPitch + rotatedZ * cosPitch
  const scale = 1 / (1 + depth * PERSPECTIVE_STRENGTH)

  return {
    x: PLOT_CENTER.x + rotatedX * PLOT_SCALE * scale,
    y: PLOT_CENTER.y - rotatedY * PLOT_SCALE * scale,
    z: coordinate.z,
    depth,
    scale,
  }
}

function getMetricValue(model: JoinedModel, metric: Metric) {
  const dataKey = METRIC_CONFIG[metric].dataKey as keyof JoinedModel
  const value = model[dataKey]

  return typeof value === 'number' ? value : null
}

export function ComparisonChart3D({
  models,
  metrics,
}: {
  models: Array<JoinedModel>
  metrics: Record<AxisName, Metric>
}) {
  const dragRef = useRef<{
    pointerId: number
    x: number
    y: number
    rotation: Rotation
  } | null>(null)
  const frameRef = useRef(0)
  const nextRotationRef = useRef<Rotation>(DEFAULT_ROTATION)
  const [rotation, setRotation] = useState<Rotation>(DEFAULT_ROTATION)
  const [activeId, setActiveId] = useState<string | null>(null)
  const chartData = useMemo(() => {
    const rawPoints = models.flatMap((model) => {
      const values = {
        x: getMetricValue(model, metrics.x),
        y: getMetricValue(model, metrics.y),
        z: getMetricValue(model, metrics.z),
      }

      if (values.x == null || values.y == null || values.z == null) return []

      return [{ model, values: values as Record<AxisName, number> }]
    })
    const ranges = Object.fromEntries(
      AXES.map((axis) => {
        const values = rawPoints.map((point) => point.values[axis])
        return [axis, { min: Math.min(...values), max: Math.max(...values) }]
      }),
    ) as Record<AxisName, { min: number; max: number }>

    return { rawPoints, ranges }
  }, [metrics, models])
  const geometry = useMemo(() => {
    const projectedVertices = CUBE_VERTICES.map((vertex) => getProjection(vertex, rotation))
    const gridLines = GRID_STEPS.flatMap((step) => [
      [
        getProjection({ x: CUBE_MIN, y: CUBE_MIN, z: step }, rotation),
        getProjection({ x: CUBE_MAX, y: CUBE_MIN, z: step }, rotation),
      ],
      [
        getProjection({ x: step, y: CUBE_MIN, z: CUBE_MIN }, rotation),
        getProjection({ x: step, y: CUBE_MIN, z: CUBE_MAX }, rotation),
      ],
    ])
    const axisLabels = Object.fromEntries(
      AXES.map((axis) => [axis, getProjection(AXIS_ENDPOINTS[axis], rotation)]),
    ) as Record<AxisName, ProjectedCoordinate>
    const points = chartData.rawPoints
      .map(({ model, values }): PlotPoint => {
        const coordinate = Object.fromEntries(
          AXES.map((axis) => {
            const range = chartData.ranges[axis]
            const span = range.max - range.min
            const normalized = span === 0 ? 0.5 : (values[axis] - range.min) / span
            return [axis, normalized - 0.5]
          }),
        ) as Coordinate
        const effortLabel = model.effort === 'default' ? '' : ` [${model.effort}]`

        return {
          ...model,
          id: `${model.slug}-${model.effort}`,
          label: `${model.displayName}${effortLabel}`,
          values,
          coordinate,
          projected: getProjection(coordinate, rotation),
        }
      })
      .sort((left, right) => left.projected.depth - right.projected.depth)

    return { projectedVertices, gridLines, axisLabels, points }
  }, [chartData, rotation])
  const activePoint =
    geometry.points.find((point) => point.id === activeId) ?? geometry.points.at(-1) ?? null

  useEffect(
    () => () => {
      cancelAnimationFrame(frameRef.current)
    },
    [],
  )

  function updateRotation(nextRotation: Rotation) {
    nextRotationRef.current = nextRotation
    cancelAnimationFrame(frameRef.current)
    frameRef.current = requestAnimationFrame(() => {
      setRotation(nextRotationRef.current)
    })
  }

  function handlePointerDown(event: React.PointerEvent<SVGSVGElement>) {
    if (event.button !== 0) return

    event.currentTarget.setPointerCapture(event.pointerId)
    dragRef.current = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      rotation,
    }
    event.currentTarget.dataset.dragging = 'true'
  }

  function handlePointerMove(event: React.PointerEvent<SVGSVGElement>) {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return

    const nextPitch = Math.max(
      -Math.PI / 2,
      Math.min(Math.PI / 2, drag.rotation.pitch - (event.clientY - drag.y) * 0.008),
    )
    updateRotation({
      pitch: nextPitch,
      yaw: drag.rotation.yaw + (event.clientX - drag.x) * 0.008,
    })
  }

  function handlePointerUp(event: React.PointerEvent<SVGSVGElement>) {
    if (dragRef.current?.pointerId !== event.pointerId) return

    dragRef.current = null
    delete event.currentTarget.dataset.dragging
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }

  function handlePointKeyDown(event: React.KeyboardEvent<SVGCircleElement>, index: number) {
    const direction = ['ArrowRight', 'ArrowDown'].includes(event.key)
      ? 1
      : ['ArrowLeft', 'ArrowUp'].includes(event.key)
        ? -1
        : 0

    if (direction === 0) return

    event.preventDefault()
    const nextIndex = (index + direction + geometry.points.length) % geometry.points.length
    event.currentTarget.ownerSVGElement
      ?.querySelector<SVGCircleElement>(`[data-3d-point="${nextIndex}"]`)
      ?.focus()
  }

  if (geometry.points.length === 0) {
    return (
      <div className="flex min-h-[32rem] items-center justify-center border-y border-border text-sm text-muted-foreground">
        No models have values for all three selected metrics
      </div>
    )
  }

  return (
    <div className="border-y border-border">
      <div className="flex flex-col lg:flex-row">
        <div className="relative min-w-0 flex-1 bg-card">
          <div className="absolute top-3 left-3 z-10 flex items-center gap-1 rounded-md bg-background p-1">
            {Object.entries(VIEW_PRESETS).map(([label, view]) => (
              <button
                key={label}
                type="button"
                onClick={() => updateRotation(view)}
                className={`rounded px-2.5 text-xs text-muted-foreground ${MOBILE_TOUCH_TARGET_CLASS} ${INTERACTIVE_SURFACE_CLASS}`}
              >
                {label}
              </button>
            ))}
          </div>
          <p className="pointer-events-none absolute bottom-3 left-3 z-10 hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex">
            <Rotate3D aria-hidden="true" className="h-3.5 w-3.5" />
            Drag to rotate
          </p>
          <svg
            viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
            role="group"
            aria-label={`Interactive 3D scatter plot of ${METRIC_CONFIG[metrics.x].label}, ${METRIC_CONFIG[metrics.y].label}, and ${METRIC_CONFIG[metrics.z].label}`}
            className="block h-[32rem] w-full cursor-grab touch-none select-none data-[dragging=true]:cursor-grabbing sm:h-[38rem]"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          >
            <g aria-hidden="true">
              {geometry.gridLines.map(([start, end], index) => (
                <line
                  key={index}
                  x1={start.x}
                  y1={start.y}
                  x2={end.x}
                  y2={end.y}
                  stroke="var(--border)"
                  strokeOpacity={0.45}
                />
              ))}
              {CUBE_EDGES.map(([startIndex, endIndex]) => {
                const start = geometry.projectedVertices[startIndex]
                const end = geometry.projectedVertices[endIndex]

                return (
                  <line
                    key={`${startIndex}-${endIndex}`}
                    x1={start.x}
                    y1={start.y}
                    x2={end.x}
                    y2={end.y}
                    stroke="var(--border)"
                    strokeWidth={1.25}
                  />
                )
              })}
              {AXES.map((axis) => {
                const position = geometry.axisLabels[axis]

                return (
                  <text
                    key={axis}
                    x={position.x}
                    y={position.y}
                    fill="var(--foreground)"
                    fontSize={12}
                    fontWeight={600}
                    textAnchor="middle"
                    dominantBaseline="middle"
                  >
                    {axis.toUpperCase()} · {METRIC_CONFIG[metrics[axis]].shortLabel}
                  </text>
                )
              })}
            </g>
            <g>
              {geometry.points.map((point, index) => {
                const isActive = point.id === activePoint?.id
                const radius = (isActive ? 8 : 5.5) * point.projected.scale

                return (
                  <g key={point.id}>
                    <circle
                      data-3d-point={index}
                      tabIndex={0}
                      role="button"
                      aria-label={`${point.label}: ${AXES.map((axis) => `${METRIC_CONFIG[metrics[axis]].label} ${formatMetric(point.values[axis], metrics[axis])}`).join(', ')}`}
                      cx={point.projected.x}
                      cy={point.projected.y}
                      r={radius}
                      fill={FAMILY_CHART_COLORS[point.family]}
                      stroke={isActive ? 'var(--foreground)' : 'var(--background)'}
                      strokeWidth={isActive ? 3 : 2}
                      className="transition-[r,opacity] duration-200 outline-none focus-visible:stroke-[var(--ring)]"
                      onPointerEnter={() => setActiveId(point.id)}
                      onFocus={() => setActiveId(point.id)}
                      onClick={(event) => {
                        event.stopPropagation()
                        setActiveId(point.id)
                      }}
                      onKeyDown={(event) => handlePointKeyDown(event, index)}
                    />
                    <text
                      x={point.projected.x + 10}
                      y={point.projected.y - 9}
                      fill="var(--foreground)"
                      stroke="var(--card)"
                      strokeWidth={3.5}
                      paintOrder="stroke"
                      fontSize={10.5}
                      className="chart-3d-label pointer-events-none"
                    >
                      {point.label}
                    </text>
                  </g>
                )
              })}
            </g>
          </svg>
        </div>

        <aside
          aria-live="polite"
          className="w-full border-t border-border p-5 lg:w-64 lg:border-t-0 lg:border-l"
        >
          <p className="text-xs text-muted-foreground">
            {geometry.points.length} comparable variants
          </p>
          {activePoint ? (
            <>
              <h2 className="mt-2 text-base font-semibold tracking-tight">{activePoint.label}</h2>
              <dl className="mt-6 space-y-4">
                {AXES.map((axis) => (
                  <div key={axis}>
                    <dt className="text-xs text-muted-foreground">
                      {axis.toUpperCase()} · {METRIC_CONFIG[metrics[axis]].label}
                    </dt>
                    <dd className="mt-0.5 text-sm font-medium">
                      {formatMetric(activePoint.values[axis], metrics[axis])}
                      <span className="ml-1 font-normal text-muted-foreground">
                        {METRIC_CONFIG[metrics[axis]].unit}
                      </span>
                    </dd>
                  </div>
                ))}
              </dl>
              <p className="mt-7 text-xs leading-5 text-muted-foreground">
                Arrow keys move between points when the plot is focused.
              </p>
            </>
          ) : null}
        </aside>
      </div>
    </div>
  )
}
