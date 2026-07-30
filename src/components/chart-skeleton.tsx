const CHART_GRID_LINES = 4
const TABLE_SKELETON_ROWS = 10

export function ChartSkeleton() {
  return (
    <div
      data-chart-frame="loading"
      className={`relative w-full ${CHART_HEIGHT_CLASS}`}
      aria-label="Loading comparison chart"
      role="status"
    >
      <div className="absolute bottom-10 left-20 right-10 top-10 overflow-hidden border-b border-l border-border">
        <div className="skeleton-shimmer absolute inset-0 opacity-70" />
        {Array.from({ length: CHART_GRID_LINES }, (_, index) => (
          <div
            key={index}
            className="absolute left-0 right-0 h-px bg-border"
            style={{ top: `${(index + 1) * 20}%` }}
          />
        ))}
      </div>
      <div className="skeleton-shimmer absolute bottom-2 left-1/2 h-3 w-24 -translate-x-1/2 rounded-sm opacity-70" />
      <div className="skeleton-shimmer absolute left-2 top-1/2 h-24 w-3 -translate-y-1/2 rounded-sm opacity-70" />
      <span className="sr-only">Loading model data</span>
    </div>
  )
}

export function TableSkeleton() {
  return (
    <div
      data-table-frame="loading"
      aria-label="Loading leaderboard"
      role="status"
      className="overflow-x-auto border-y border-border lg:overflow-x-visible"
    >
      <table
        aria-hidden="true"
        className={`${TABLE_WIDTH_CLASS} border-collapse text-sm`}
      >
        <thead>
          <tr className="border-b border-border">
            {['w-40', 'w-40', 'w-20', 'w-20', 'w-20', 'w-16'].map(
              (width, index) => (
                <th
                  key={index}
                  className="h-11 px-3 text-left sm:h-10"
                >
                  <div
                    className={`skeleton-shimmer h-3 rounded-sm opacity-70 ${width}`}
                  />
                </th>
              ),
            )}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: TABLE_SKELETON_ROWS }, (_, rowIndex) => (
            <tr key={rowIndex} className="border-b border-border last:border-b-0">
              <td className="h-11 px-3">
                <div className="skeleton-shimmer h-3 w-40 rounded-sm opacity-70" />
              </td>
              <td className="h-11 px-3">
                <div className="ml-auto flex w-40 items-center gap-3">
                  <div className="skeleton-shimmer h-3 w-12 rounded-sm opacity-70" />
                  <div className="skeleton-shimmer h-1.5 flex-1 rounded-full opacity-70" />
                </div>
              </td>
              {Array.from({ length: 4 }, (_, cellIndex) => (
                <td key={cellIndex} className="h-11 px-3">
                  <div className="skeleton-shimmer ml-auto h-3 w-16 rounded-sm opacity-70" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <span className="sr-only">Loading leaderboard rows</span>
    </div>
  )
}
import { CHART_HEIGHT_CLASS, TABLE_WIDTH_CLASS } from '#/lib/layout-styles'
