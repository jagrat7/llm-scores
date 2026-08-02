import type { getModelConfig } from "./model-config"

export type SourceName = "deepswe" | "artificialAnalysis"
export type SourceStatus = "ok" | "error"
export type MetricSource = "DeepSWE" | "Artificial Analysis" | null

export type JoinedModel = {
  slug: string
  displayName: string
  family: ReturnType<typeof getModelConfig>["family"]
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
