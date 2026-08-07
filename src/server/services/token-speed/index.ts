import type { ProviderModelReader } from "../provider/provider-service.interface"

const TOKEN_SPEED_PROVIDERS = ["artificialAnalysis"] as const

export type TokenSpeedProviderName = (typeof TOKEN_SPEED_PROVIDERS)[number]

export class TokenSpeedService {
  static readonly providers = TOKEN_SPEED_PROVIDERS

  constructor(private readonly providerService: ProviderModelReader<TokenSpeedProviderName>) {}

  async getTokensPerSecond(model: string, provider: TokenSpeedProviderName, effort?: string) {
    return (await this.providerService.getModel(provider, model, effort))?.tokensPerSecond ?? null
  }
}
