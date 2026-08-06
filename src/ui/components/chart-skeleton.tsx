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
      <div className="border-border absolute top-10 right-10 bottom-10 left-20 overflow-hidden border-b border-l">
        <div className="skeleton-shimmer absolute inset-0 opacity-70" />
        {Array.from({ length: CHART_GRID_LINES }, (_, index) => (
          <div
            key={index}
            className="bg-border absolute right-0 left-0 h-px"
            style={{ top: `${(index + 1) * 20}%` }}
          />
        ))}
      </div>
      <div className="skeleton-shimmer absolute bottom-2 left-1/2 h-3 w-24 -translate-x-1/2 rounded-sm opacity-70" />
      <div className="skeleton-shimmer absolute top-1/2 left-2 h-24 w-3 -translate-y-1/2 rounded-sm opacity-70" />
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
      className="border-border overflow-x-auto border-y lg:overflow-x-visible"
    >
      <table aria-hidden="true" className={`${TABLE_WIDTH_CLASS} border-collapse text-sm`}>
        <thead>
          <tr className="border-border border-b">
            {["w-40", "w-40", "w-20", "w-20", "w-20", "w-16"].map((width, index) => (
              <th key={index} className="h-11 px-3 text-left sm:h-10">
                <div className={`skeleton-shimmer h-3 rounded-sm opacity-70 ${width}`} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: TABLE_SKELETON_ROWS }, (_, rowIndex) => (
            <tr key={rowIndex} className="border-border border-b last:border-b-0">
              <td className="h-11 px-3">
                <div className="skeleton-shimmer h-3 w-40 rounded-sm opacity-70" />
              </td>
              <td className="h-11 px-3">
                <div className="ml-auto flex w-40 items-center gap-3">
                  <div className="skeleton-shimmer h-3 w-12 rounded-sm opacity-70" />
                  <div className="skeleton-shimmer h-1.5 flex-1 rounded-full opacity-70" />
                </div>
              </td>
              {Array.from({ length: 4 }, (_unused, cellIndex) => (
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
import { CHART_HEIGHT_CLASS, TABLE_WIDTH_CLASS } from "#/ui/lib/layout-styles"
