import { describe, expect, it } from "vitest"

import { joinModelData } from "./models"

describe("joinModelData", () => {
  it("matches effort-specific Artificial Analysis slugs before base slugs", () => {
    const models = joinModelData(
      {
        rows: [
          {
            model: "gpt-5-5",
            pass_rate: 0.67,
            reasoning_effort: "high",
            mean_duration_seconds: 120,
            mean_output_tokens: 10_000,
            mean_cost_usd: 2,
          },
        ],
      },
      [
        {
          slug: "gpt-5-5",
          pricing: {
            price_1m_input_tokens: 1,
            price_1m_output_tokens: 5,
          },
          performance: { median_output_tokens_per_second: 50 },
        },
        {
          slug: "gpt-5-5-high",
          pricing: {
            price_1m_input_tokens: 2,
            price_1m_output_tokens: 10,
          },
          performance: { median_output_tokens_per_second: 75 },
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
