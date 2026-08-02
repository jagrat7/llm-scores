import { createFileRoute, Link } from "@tanstack/react-router"
import { ArrowLeftRight } from "lucide-react"
import { lazy, Suspense } from "react"
import { z } from "zod"

import { ChartSkeleton } from "#/components/chart-skeleton"
import { DataState } from "#/components/data-state"
import { MetricSelect } from "#/components/metric-select"
import { ModelPicker } from "#/components/model-picker"
import { PageShell } from "#/components/page-shell"
import { SourceFooter } from "#/components/source-attribution"
import { INTERACTIVE_SURFACE_CLASS, MOBILE_TOUCH_TARGET_CLASS } from "#/lib/interaction-styles"
import { CHART_HEIGHT_CLASS } from "#/lib/layout-styles"
import { METRICS } from "#/lib/metrics"
import { useModels } from "#/lib/use-models"

const ComparisonChart = lazy(() =>
  import("#/components/comparison-chart").then((module) => ({
    default: module.ComparisonChart,
  })),
)

const metricSchema = z.enum(METRICS)
const compareSearchSchema = z.object({
  x: metricSchema.catch("cost").default("cost"),
  y: metricSchema.catch("score").default("score"),
  models: z
    .preprocess(
      (value) => (typeof value === "string" ? [value] : value),
      z.array(z.string()).optional(),
    )
    .catch(undefined),
})

export const Route = createFileRoute("/")({
  validateSearch: (search) => compareSearchSchema.parse(search),
  component: ComparePage,
})

function ComparePage() {
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const { data, isPending, isError } = useModels()

  function updateSearch(update: Partial<typeof search>) {
    void navigate({
      search: (previous) => ({ ...previous, ...update }),
      replace: true,
    })
  }

  const selected = search.models ?? data?.defaultModels ?? []
  const selectedModelIds = new Set(selected)
  const selectedModels = data?.models.filter((model) => selectedModelIds.has(model.model)) ?? []
  const controlsDisabled = isPending ? true : isError

  return (
    <PageShell className="pt-4 pb-6">
      <h1 className="sr-only">Compare language models</h1>
      <div className="mb-3 flex flex-wrap items-center gap-2 sm:pr-10 sm:pl-20">
        <MetricSelect
          axis="X"
          value={search.x}
          onChange={(x) => updateSearch({ x })}
          disabled={controlsDisabled}
        />
        <button
          type="button"
          onClick={() => updateSearch({ x: search.y, y: search.x })}
          className={`text-muted-foreground inline-flex w-11 items-center justify-center rounded-md sm:w-8 ${MOBILE_TOUCH_TARGET_CLASS} ${INTERACTIVE_SURFACE_CLASS}`}
          aria-label="Swap chart axes"
          title="Swap axes"
          disabled={controlsDisabled}
        >
          <ArrowLeftRight aria-hidden="true" className="h-3.5 w-3.5" />
        </button>
        <MetricSelect
          axis="Y"
          value={search.y}
          onChange={(y) => updateSearch({ y })}
          disabled={controlsDisabled}
        />
        <ModelPicker
          models={data?.models ?? []}
          selected={selected}
          onChange={(models) => updateSearch({ models })}
          disabled={controlsDisabled}
        />
      </div>

      {isPending ? <ChartSkeleton /> : null}
      {isError ? (
        <DataState className={CHART_HEIGHT_CLASS} tone="error">
          Unable to load model data
        </DataState>
      ) : null}
      {data && selected.length === 0 ? (
        <DataState className={CHART_HEIGHT_CLASS}>
          <p>Select models to compare</p>
          <ModelPicker
            models={data.models}
            selected={selected}
            onChange={(models) => updateSearch({ models })}
            align="center"
          />
        </DataState>
      ) : null}
      {data && selected.length > 0 && selectedModels.length === 0 ? (
        <DataState className={CHART_HEIGHT_CLASS}>
          <p>No selected models are available</p>
          <ModelPicker
            models={data.models}
            selected={selected}
            onChange={(models) => updateSearch({ models })}
            align="center"
          />
        </DataState>
      ) : null}
      {data && selectedModels.length > 0 ? (
        <Suspense fallback={<ChartSkeleton />}>
          <ComparisonChart models={selectedModels} xMetric={search.x} yMetric={search.y} />
        </Suspense>
      ) : null}

      {data ? (
        <SourceFooter>
          <Link
            to="/leaderboard"
            className="text-muted-foreground decoration-border hover:text-foreground active:text-foreground inline-flex min-h-11 items-center text-sm underline underline-offset-2 transition-colors duration-200 ease-out sm:min-h-6 sm:text-xs"
          >
            View data table
          </Link>
        </SourceFooter>
      ) : null}
    </PageShell>
  )
}
