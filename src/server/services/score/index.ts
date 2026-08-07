import type { ProviderModelReader } from "../provider/provider-service.interface"

const SCORE_PROVIDERS = ["deepswe"] as const

export type ScoreProviderName = (typeof SCORE_PROVIDERS)[number]

export class ScoreService {
  static readonly providers = SCORE_PROVIDERS

  constructor(private readonly providerService: ProviderModelReader<ScoreProviderName>) {}

  async getScore(model: string, provider: ScoreProviderName, effort?: string) {
    return (await this.providerService.getModel(provider, model, effort))?.score ?? null
  }
}
