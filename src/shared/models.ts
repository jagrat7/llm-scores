import type { ModelFamily } from "./model-config"

export const MODEL_SOURCES = {
  deepswe: "DeepSWE",
  artificialAnalysis: "Artificial Analysis",
} as const

export type SourceName = keyof typeof MODEL_SOURCES
export type SourceStatus = "ok" | "error"
export type MetricSource = (typeof MODEL_SOURCES)[SourceName] | null

export type JoinedModel = {
  slug: string
  displayName: string
  family: ModelFamily
  effort: string
  score: number | null
  costPerMTokens: number | null
  tokensPerSecond: number | null
  durationSeconds: number | null
  sources: {
    score: MetricSource
    costPerMTokens: MetricSource
    tokensPerSecond: MetricSource
    durationSeconds: MetricSource
  }
}

export type ModelsResponse = {
  models: Array<JoinedModel>
  fetchedAt: string
  cacheAgeSeconds: number | null
  sources: Record<SourceName, SourceStatus>
}
