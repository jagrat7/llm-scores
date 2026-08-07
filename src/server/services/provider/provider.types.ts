import type { ModelFamily } from "./model-config"

export const PROVIDERS = {
  deepswe: { displayName: "DeepSWE" },
  artificialAnalysis: { displayName: "Artificial Analysis" },
} as const

export type ProviderName = keyof typeof PROVIDERS
export type ProviderStatus = "ok" | "error"

export type ProviderModel = {
  model: string
  displayName: string
  family: ModelFamily
  chartColor: string
  isDefault: boolean
  effort: string
  effortOrder: number
}

export type DeepSWEProviderModel = ProviderModel & {
  score: number | null
  costPerMTokens: number | null
  durationSeconds: number | null
}

export type ArtificialAnalysisProviderModel = ProviderModel & {
  tokensPerSecond: number | null
}

export type ProviderModelDataByProvider = {
  deepswe: DeepSWEProviderModel
  artificialAnalysis: ArtificialAnalysisProviderModel
}

export type ProviderModelData = ProviderModelDataByProvider[ProviderName]
