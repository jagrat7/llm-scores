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

export type ProviderModelData = ProviderModel & {
  score: number | null
  costPerMTokens: number | null
  tokensPerSecond: number | null
  durationSeconds: number | null
}
