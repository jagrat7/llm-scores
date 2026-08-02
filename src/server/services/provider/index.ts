import { ProviderCache, type CachedSource } from "../cache"
import { ArtificialAnalysisProvider } from "./artificial-analysis"
import { DeepSWEProvider } from "./deep-swe"
import type { ProviderService } from "./provider-service.interface"
import type { ProviderModel, ProviderModelData, ProviderName } from "./provider.types"

type ProviderIntegration = {
  readonly cacheKey: string
  fetchModels(): Promise<Array<ProviderModelData>>
}

type ProviderRegistry = Record<ProviderName, ProviderIntegration>

export class ProviderDataService implements ProviderService {
  constructor(
    private readonly cache = new ProviderCache(),
    private readonly providers: ProviderRegistry = {
      deepswe: new DeepSWEProvider(),
      artificialAnalysis: new ArtificialAnalysisProvider(),
    },
  ) {}

  async fetchModels(provider: ProviderName): Promise<CachedSource<Array<ProviderModelData>>> {
    const integration = this.providers[provider]

    return this.cache.fetch(integration.cacheKey, () => integration.fetchModels())
  }

  async listModels(provider: ProviderName): Promise<Array<ProviderModel>> {
    const source = await this.fetchModels(provider)

    return (source.data ?? []).map(
      ({ model, displayName, family, chartColor, isDefault, effort, effortOrder }) => ({
        model,
        displayName,
        family,
        chartColor,
        isDefault,
        effort,
        effortOrder,
      }),
    )
  }

  async getScore(model: string, provider: ProviderName, effort?: string) {
    return (await this.getProviderModel(model, provider, effort))?.score ?? null
  }

  async getCostPerMTokens(model: string, provider: ProviderName, effort?: string) {
    return (await this.getProviderModel(model, provider, effort))?.costPerMTokens ?? null
  }

  async getTokensPerSecond(model: string, provider: ProviderName, effort?: string) {
    return (await this.getProviderModel(model, provider, effort))?.tokensPerSecond ?? null
  }

  async getDurationSeconds(model: string, provider: ProviderName, effort?: string) {
    return (await this.getProviderModel(model, provider, effort))?.durationSeconds ?? null
  }

  private async getProviderModel(model: string, provider: ProviderName, effort = "default") {
    const source = await this.fetchModels(provider)

    return (
      source.data?.find(
        (providerModel) => providerModel.model === model && providerModel.effort === effort,
      ) ?? null
    )
  }
}

export type { ProviderModelData } from "./provider.types"
