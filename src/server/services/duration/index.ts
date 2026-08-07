import type { ProviderModelReader } from "../provider/provider-service.interface"

const DURATION_PROVIDERS = ["deepswe"] as const

export type DurationProviderName = (typeof DURATION_PROVIDERS)[number]

export class DurationService {
  static readonly providers = DURATION_PROVIDERS

  constructor(private readonly providerService: ProviderModelReader<DurationProviderName>) {}

  async getDurationSeconds(model: string, provider: DurationProviderName, effort?: string) {
    return (await this.providerService.getModel(provider, model, effort))?.durationSeconds ?? null
  }
}
