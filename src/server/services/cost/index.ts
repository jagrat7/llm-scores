import type { ProviderModelReader } from "../provider/provider-service.interface"

const COST_PROVIDERS = ["deepswe"] as const

export type CostProviderName = (typeof COST_PROVIDERS)[number]

export class CostService {
  static readonly providers = COST_PROVIDERS

  constructor(private readonly providerService: ProviderModelReader<CostProviderName>) {}

  async getCostPerMTokens(model: string, provider: CostProviderName, effort?: string) {
    return (await this.providerService.getModel(provider, model, effort))?.costPerMTokens ?? null
  }
}
