import { afterEach, describe, expect, it, vi } from "vitest"

import { ArtificialAnalysisProvider } from "./artificial-analysis"

const originalFetch = globalThis.fetch

vi.mock("#/env", () => ({ env: { AA_API_KEY: "test-api-key" } }))

afterEach(() => {
  globalThis.fetch = originalFetch
})

describe("ArtificialAnalysisProvider", () => {
  it("only exposes metrics published by Artificial Analysis", async () => {
    globalThis.fetch = vi.fn(async () =>
      Response.json({
        data: [
          {
            slug: "gpt-5-6-luna-low",
            pricing: {
              price_1m_input_tokens: 0.2,
              price_1m_output_tokens: 1.2,
            },
          },
        ],
        pagination: { has_more: false },
      }),
    )

    const models = await new ArtificialAnalysisProvider().fetchModels()

    expect(models[0]).not.toHaveProperty("costPerMTokens")
    expect(models[0]).not.toHaveProperty("score")
    expect(models[0]).not.toHaveProperty("durationSeconds")
  })
})
