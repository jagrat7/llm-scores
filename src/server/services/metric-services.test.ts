import { describe, expect, it, vi } from "vitest"

import { CostService } from "./cost"
import { DurationService } from "./duration"
import type { ProviderModelReader } from "./provider/provider-service.interface"
import type {
  ArtificialAnalysisProviderModel,
  DeepSWEProviderModel,
} from "./provider/provider.types"
import { ScoreService } from "./score"
import { TokenSpeedService } from "./token-speed"

const model = {
  model: "test-model",
  displayName: "Test Model",
  family: "other",
  chartColor: "var(--chart-8)",
  isDefault: false,
  effort: "high",
  effortOrder: 3,
} as const

describe("metric services", () => {
  it("reads DeepSWE metrics through the provider service", async () => {
    const providerModel: DeepSWEProviderModel = {
      ...model,
      score: 72,
      costPerMTokens: 4.5,
      durationSeconds: 90,
    }
    const getModel = vi.fn<ProviderModelReader<"deepswe">["getModel"]>()
    getModel.mockResolvedValue(providerModel)
    const providerService = { getModel }

    await expect(
      new ScoreService(providerService).getScore(model.model, "deepswe", model.effort),
    ).resolves.toBe(providerModel.score)
    await expect(
      new CostService(providerService).getCostPerMTokens(model.model, "deepswe", model.effort),
    ).resolves.toBe(providerModel.costPerMTokens)
    await expect(
      new DurationService(providerService).getDurationSeconds(model.model, "deepswe", model.effort),
    ).resolves.toBe(providerModel.durationSeconds)
  })

  it("reads token speed only from Artificial Analysis data", async () => {
    const providerModel: ArtificialAnalysisProviderModel = {
      ...model,
      tokensPerSecond: 160,
    }
    const getModel = vi.fn<ProviderModelReader<"artificialAnalysis">["getModel"]>()
    getModel.mockResolvedValue(providerModel)

    await expect(
      new TokenSpeedService({ getModel }).getTokensPerSecond(
        model.model,
        "artificialAnalysis",
        model.effort,
      ),
    ).resolves.toBe(providerModel.tokensPerSecond)
  })
})
