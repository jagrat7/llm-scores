import { ProviderCache, type CachedSource } from "../cache"
import { ArtificialAnalysisProvider } from "./artificial-analysis"
import { DeepSWEProvider } from "./deep-swe"
import type { ProviderService } from "./provider-service.interface"
import type { ProviderModel, ProviderModelDataByProvider, ProviderName } from "./provider.types"

type ProviderIntegration<TProvider extends ProviderName> = {
  readonly cacheKey: string
  fetchModels(): Promise<Array<ProviderModelDataByProvider[TProvider]>>
}

type ProviderRegistry = {
  [TProvider in ProviderName]: ProviderIntegration<TProvider>
}

export class ProviderDataService implements ProviderService {
  constructor(
    private readonly cache = new ProviderCache(),
    private readonly providers: ProviderRegistry = {
      deepswe: new DeepSWEProvider(),
      artificialAnalysis: new ArtificialAnalysisProvider(),
    },
  ) {}

  async fetchModels<TProvider extends ProviderName>(
    provider: TProvider,
  ): Promise<CachedSource<Array<ProviderModelDataByProvider[TProvider]>>> {
    const integration = this.providers[provider]

    return this.cache.fetch(integration.cacheKey, () => integration.fetchModels())
  }

  async listModels(provider: ProviderName): Promise<Array<ProviderModel>> {
    const source = await this.fetchModels(provider)

    return Array.from(
      new Map(
        (source.data ?? []).map(
          ({ model, displayName, family, chartColor, isDefault, effort, effortOrder }) => [
            `${model}:${effort}`,
            { model, displayName, family, chartColor, isDefault, effort, effortOrder },
          ],
        ),
      ).values(),
    )
  }

  async getModel<TProvider extends ProviderName>(
    provider: TProvider,
    model: string,
    effort = "default",
  ): Promise<ProviderModelDataByProvider[TProvider] | null> {
    const source = await this.fetchModels(provider)

    return (
      source.data?.find(
        (providerModel) => providerModel.model === model && providerModel.effort === effort,
      ) ?? null
    )
  }
}

export type { ProviderModelData } from "./provider.types"
