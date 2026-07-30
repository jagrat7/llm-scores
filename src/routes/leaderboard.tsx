import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { TableSkeleton } from '#/components/chart-skeleton'
import { DataState } from '#/components/data-state'
import { LeaderboardTable } from '#/components/leaderboard-table'
import { PageShell } from '#/components/page-shell'
import { SourceFooter } from '#/components/source-attribution'
import { orpc } from '#/orpc/client'

export const Route = createFileRoute('/leaderboard')({
  component: LeaderboardPage,
})

function LeaderboardPage() {
  const { data, isPending, isError } = useQuery(
    orpc.models.list.queryOptions({ input: {} }),
  )

  return (
    <PageShell className="pb-8 pt-6">
      <div className="mb-5 flex items-baseline justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">
            Leaderboard
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            DeepSWE model×effort results
          </p>
        </div>
        {data ? (
          <span className="text-xs text-muted-foreground">
            {data.models.length} variants
          </span>
        ) : null}
      </div>

      {isPending ? <TableSkeleton /> : null}
      {isError ? (
        <DataState className="h-48" tone="error">
          Unable to load model data
        </DataState>
      ) : null}
      {data && data.models.length === 0 ? (
        <DataState className="h-48">No model results are available</DataState>
      ) : null}
      {data && data.models.length > 0 ? (
        <LeaderboardTable models={data.models} />
      ) : null}
      {data ? <SourceFooter data={data} /> : null}
    </PageShell>
  )
}
