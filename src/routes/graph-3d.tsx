import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { lazy, Suspense } from 'react'
import { z } from 'zod'

import { ChartSkeleton } from '#/components/chart-skeleton'
import { DataState } from '#/components/data-state'
import { MetricSelect } from '#/components/metric-select'
import { PageShell } from '#/components/page-shell'
import { SourceFooter } from '#/components/source-attribution'
import { METRICS } from '#/lib/metrics'
import { orpc } from '#/lib/orpc-client'

const ComparisonChart3D = lazy(() =>
  import('#/components/comparison-chart-3d').then((module) => ({
    default: module.ComparisonChart3D,
  })),
)
const metricSchema = z.enum(METRICS)
const graphSearchSchema = z.object({
  x: metricSchema.catch('cost').default('cost'),
  y: metricSchema.catch('score').default('score'),
  z: metricSchema.catch('speed').default('speed'),
})

export const Route = createFileRoute('/graph-3d')({
  validateSearch: (search) => graphSearchSchema.parse(search),
  component: Graph3DPage,
})

function Graph3DPage() {
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const { data, isPending, isError } = useQuery(orpc.models.list.queryOptions({ input: {} }))
  const controlsDisabled = isPending ? true : isError

  function updateSearch(update: Partial<typeof search>) {
    void navigate({
      search: (previous) => ({ ...previous, ...update }),
      replace: true,
    })
  }

  return (
    <PageShell className="pt-5 pb-8">
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">3D model space</h1>
          <p className="mt-1 max-w-xl text-xs leading-5 text-muted-foreground">
            Explore how model quality, cost, and speed relate across a third dimension.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <MetricSelect
            axis="X"
            value={search.x}
            onChange={(x) => updateSearch({ x })}
            disabled={controlsDisabled}
          />
          <MetricSelect
            axis="Y"
            value={search.y}
            onChange={(y) => updateSearch({ y })}
            disabled={controlsDisabled}
          />
          <MetricSelect
            axis="Z"
            value={search.z}
            onChange={(z) => updateSearch({ z })}
            disabled={controlsDisabled}
          />
        </div>
      </div>

      {isPending ? <ChartSkeleton /> : null}
      {isError ? (
        <DataState className="h-[32rem]" tone="error">
          Unable to load model data
        </DataState>
      ) : null}
      {data && data.models.length === 0 ? (
        <DataState className="h-[32rem]">No model results are available</DataState>
      ) : null}
      {data && data.models.length > 0 ? (
        <Suspense fallback={<ChartSkeleton />}>
          <ComparisonChart3D
            models={data.models}
            metrics={{ x: search.x, y: search.y, z: search.z }}
          />
        </Suspense>
      ) : null}
      {data ? <SourceFooter data={data} /> : null}
    </PageShell>
  )
}
