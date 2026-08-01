export const METRICS = ['score', 'cost', 'speed', 'duration'] as const

export type Metric = (typeof METRICS)[number]

export const METRIC_CONFIG: Record<
  Metric,
  { label: string; shortLabel: string; unit: string; dataKey: string }
> = {
  score: {
    label: 'Score',
    shortLabel: 'Score',
    unit: '%',
    dataKey: 'score',
  },
  cost: {
    label: 'Cost',
    shortLabel: 'Cost $/M',
    unit: '$/M tokens',
    dataKey: 'costPerMTokens',
  },
  speed: {
    label: 'Speed',
    shortLabel: 'Tokens/s',
    unit: 'tokens/s',
    dataKey: 'tokensPerSecond',
  },
  duration: {
    label: 'Duration',
    shortLabel: 'Duration',
    unit: 's',
    dataKey: 'durationSeconds',
  },
}

export function formatMetric(value: number | null, metric: Metric) {
  if (value == null) return '—'
  if (!Number.isFinite(value)) return '—'

  if (metric === 'duration') {
    const totalSeconds = Math.max(0, Math.round(value))

    if (totalSeconds < 60) return `${totalSeconds}s`

    const totalMinutes = Math.floor(totalSeconds / 60)
    const remainingSeconds = totalSeconds % 60

    if (totalSeconds < 3600) {
      return remainingSeconds === 0 ? `${totalMinutes}m` : `${totalMinutes}m ${remainingSeconds}s`
    }

    const hours = Math.floor(totalMinutes / 60)
    const remainingMinutes = totalMinutes % 60

    return remainingMinutes === 0 ? `${hours}h` : `${hours}h ${remainingMinutes}m`
  }

  if (metric === 'score') {
    return `${value.toLocaleString('en-US', { maximumFractionDigits: 1 })}%`
  }

  if (metric === 'cost') {
    return `$${value.toLocaleString('en-US', { maximumFractionDigits: 2 })}`
  }

  if (Math.abs(value) >= 1000) {
    return `${(value / 1000).toLocaleString('en-US', {
      maximumFractionDigits: 1,
    })}k`
  }

  return value.toLocaleString('en-US', { maximumFractionDigits: 1 })
}

export function formatRelativeTime(isoDate: string) {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(isoDate).getTime()) / 1000))

  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86_400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86_400)}d ago`
}
