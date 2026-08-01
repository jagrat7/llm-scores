import type { SortingState } from '@tanstack/react-table'

import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react'
import { useMemo, useState } from 'react'

import type { JoinedModel } from '#/shared/models'

import { FAMILY_CHART_COLORS } from '#/shared/model-config'
import { INTERACTIVE_SURFACE_CLASS } from '#/lib/interaction-styles'
import { TABLE_WIDTH_CLASS } from '#/lib/layout-styles'
import { formatMetric } from '#/lib/metrics'
import { cn } from '#/lib/utils'

const columnHelper = createColumnHelper<JoinedModel>()
const RIGHT_ALIGNED_COLUMN_IDS = new Set([
  'score',
  'costPerMTokens',
  'tokensPerSecond',
  'durationSeconds',
  'source',
])
const SOURCE_NAMES = ['DeepSWE', 'Artificial Analysis'] as const

function sourceLabel(model: JoinedModel) {
  const sources = new Set(Object.values(model.sources).filter(Boolean))
  const labels = SOURCE_NAMES.filter((source) => sources.has(source))

  return labels.length > 0 ? labels.join(' · ') : '—'
}

export function LeaderboardTable({ models }: { models: Array<JoinedModel> }) {
  const [sorting, setSorting] = useState<SortingState>([{ id: 'score', desc: true }])
  const columns = useMemo(
    () => [
      columnHelper.accessor('displayName', {
        header: 'Model',
        cell: ({ row, getValue }) => {
          const effortLabel = row.original.effort === 'default' ? '' : ` [${row.original.effort}]`
          const modelLabel = `${getValue()}${effortLabel}`

          return (
            <div className="w-48 max-w-48" title={modelLabel}>
              <div className="truncate">
                <span className="font-medium text-foreground">{getValue()}</span>
                {effortLabel ? (
                  <span className="ml-1.5 text-sm text-muted-foreground sm:text-xs">
                    {effortLabel.trim()}
                  </span>
                ) : null}
              </div>
            </div>
          )
        },
      }),
      columnHelper.accessor('score', {
        header: 'Score',
        sortUndefined: 'last',
        cell: ({ row, getValue }) => {
          const score = getValue()
          return (
            <div className="ml-auto flex min-w-40 items-center justify-end gap-3">
              <span className="w-12 text-right">{formatMetric(score, 'score')}</span>
              <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                <span
                  className="block h-full origin-left rounded-full transition-transform duration-200 ease-out"
                  style={{
                    transform: `scaleX(${Math.max(0, Math.min(100, score ?? 0)) / 100})`,
                    backgroundColor: FAMILY_CHART_COLORS[row.original.family],
                  }}
                />
              </span>
            </div>
          )
        },
      }),
      columnHelper.accessor('costPerMTokens', {
        header: 'Cost $/M',
        sortUndefined: 'last',
        cell: ({ getValue }) => formatMetric(getValue(), 'cost'),
      }),
      columnHelper.accessor('tokensPerSecond', {
        header: 'Tokens/s',
        sortUndefined: 'last',
        cell: ({ getValue }) => formatMetric(getValue(), 'speed'),
      }),
      columnHelper.accessor('durationSeconds', {
        header: 'Duration',
        sortUndefined: 'last',
        cell: ({ getValue }) => formatMetric(getValue(), 'duration'),
      }),
      columnHelper.display({
        id: 'source',
        header: 'Source',
        cell: ({ row }) => {
          const label = sourceLabel(row.original)

          return (
            <span
              title={label === '—' ? undefined : label}
              aria-label={label === '—' ? 'No source available' : label}
              className="text-sm text-muted-foreground sm:text-xs"
            >
              {label}
            </span>
          )
        },
      }),
    ],
    [],
  )
  const table = useReactTable({
    data: models,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  return (
    <div
      className="overflow-x-auto border-y border-border lg:overflow-x-visible"
      data-table-frame="loaded"
    >
      <table className={`${TABLE_WIDTH_CLASS} border-collapse text-left text-sm tabular-nums`}>
        <thead className="bg-background lg:sticky lg:top-12 lg:z-20">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id} className="border-b border-border">
              {headerGroup.headers.map((header, index) => {
                const sorted = header.column.getIsSorted()
                const canSort = header.column.getCanSort()
                const rightAligned = RIGHT_ALIGNED_COLUMN_IDS.has(header.id)
                const SortIcon =
                  sorted === 'asc' ? ArrowUp : sorted === 'desc' ? ArrowDown : ArrowUpDown

                return (
                  <th
                    key={header.id}
                    scope="col"
                    aria-sort={
                      sorted === 'asc'
                        ? 'ascending'
                        : sorted === 'desc'
                          ? 'descending'
                          : canSort
                            ? 'none'
                            : undefined
                    }
                    className={cn(
                      'h-11 px-3 text-sm font-medium whitespace-nowrap text-muted-foreground sm:h-10 sm:text-xs',
                      rightAligned ? 'text-right' : null,
                      index === 0 ? 'sticky left-0 z-30 bg-background lg:static' : null,
                    )}
                  >
                    {canSort ? (
                      <button
                        type="button"
                        onClick={header.column.getToggleSortingHandler()}
                        className={cn(
                          '-mx-2 inline-flex min-h-11 items-center gap-1 rounded-sm px-2 sm:min-h-8',
                          rightAligned ? 'ml-auto justify-end' : null,
                          sorted ? 'text-foreground' : null,
                          INTERACTIVE_SURFACE_CLASS,
                        )}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        <SortIcon aria-hidden="true" className="h-3 w-3" />
                      </button>
                    ) : (
                      flexRender(header.column.columnDef.header, header.getContext())
                    )}
                  </th>
                )
              })}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr
              key={row.id}
              className="group border-b border-border last:border-b-0 hover:bg-muted/60"
            >
              {row.getVisibleCells().map((cell, index) => (
                <td
                  key={cell.id}
                  className={cn(
                    'h-11 px-3 whitespace-nowrap text-foreground',
                    RIGHT_ALIGNED_COLUMN_IDS.has(cell.column.id) ? 'text-right' : null,
                    index === 0
                      ? 'sticky left-0 z-10 bg-background transition-colors duration-200 ease-out group-hover:bg-muted/60 lg:static'
                      : null,
                  )}
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
