import { describe, expect, it } from "vitest"

import { ModelsService } from "./models"

const modelsService = new ModelsService()

describe("ModelsService", () => {
  it("matches effort-specific Artificial Analysis slugs before base slugs", () => {
    const models = modelsService.joinModels(
      [
        {
          slug: "gpt-5-5",
          effort: "high",
          score: 67,
          costPerMTokens: 200,
          durationSeconds: 120,
        },
      ],
      [
        {
          providerSlug: "gpt-5-5",
          slug: "gpt-5-5",
          displayName: undefined,
          effort: "default",
          costPerMTokens: 2,
          tokensPerSecond: 50,
        },
        {
          providerSlug: "gpt-5-5-high",
          slug: "gpt-5-5",
          displayName: undefined,
          effort: "high",
          costPerMTokens: 4,
          tokensPerSecond: 75,
        },
      ],
    )

    expect(models[0]).toMatchObject({
      displayName: "GPT-5.5",
      effort: "high",
      score: 67,
      costPerMTokens: 4,
      tokensPerSecond: 75,
      durationSeconds: 120,
    })
  })
})
