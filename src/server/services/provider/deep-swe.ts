import { z } from "zod"

import { EFFORT_ORDER, getModelConfig } from "./model-config"
import type { ProviderModelData } from "./provider.types"

const API_URL = "https://deepswe.datacurve.ai/artifacts/v1.1/leaderboard-live.json"
const CACHE_KEY = "llm-scores:deepswe:v1.1:models:v1"
const REQUEST_TIMEOUT_MS = 20_000

const nullableNumber = z.number().nullable().optional()

const modelSchema = z.object({
  model: z.string(),
  pass_rate: z.number(),
  reasoning_effort: z.string().nullable().optional(),
  mean_duration_seconds: nullableNumber,
  mean_input_tokens: nullableNumber,
  mean_output_tokens: nullableNumber,
  mean_cost_usd: nullableNumber,
})

const payloadSchema = z.object({
  rows: z.array(modelSchema),
})

export class DeepSWEProvider {
  readonly cacheKey = CACHE_KEY

  async fetchModels(): Promise<Array<ProviderModelData>> {
    const response = await fetch(API_URL, {
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    })

    if (!response.ok) throw new Error(`DeepSWE returned ${response.status}`)

    const payload = payloadSchema.parse(await response.json())

    return payload.rows.map((model) => {
      const tokens = (model.mean_input_tokens ?? 0) + (model.mean_output_tokens ?? 0)
      const effort = model.reasoning_effort ?? "default"
      const config = getModelConfig(model.model)

      return {
        model: model.model,
        displayName: config.displayName,
        family: config.family,
        chartColor: config.chartColor,
        isDefault: config.isDefault,
        effort,
        effortOrder: EFFORT_ORDER[effort] ?? 0,
        score: model.pass_rate * 100,
        costPerMTokens:
          model.mean_cost_usd != null && tokens > 0
            ? (model.mean_cost_usd / tokens) * 1_000_000
            : null,
        tokensPerSecond: null,
        durationSeconds: model.mean_duration_seconds ?? null,
      }
    })
  }
}
