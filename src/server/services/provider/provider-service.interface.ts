import type { ProviderModel, ProviderName } from "./provider.types"

export interface ProviderService {
  listModels(provider: ProviderName): Promise<Array<ProviderModel>>
  getScore(model: string, provider: ProviderName, effort?: string): Promise<number | null>
  getCostPerMTokens(model: string, provider: ProviderName, effort?: string): Promise<number | null>
  getTokensPerSecond(model: string, provider: ProviderName, effort?: string): Promise<number | null>
  getDurationSeconds(model: string, provider: ProviderName, effort?: string): Promise<number | null>
}
