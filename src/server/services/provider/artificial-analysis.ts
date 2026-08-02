import { z } from "zod"

import { env } from "#/env"

import { EFFORT_ORDER, getModelConfig } from "./model-config"
import type { ProviderModelData } from "./provider.types"

const API_URL = "https://artificialanalysis.ai/api/v2/language/models/free"
const CACHE_KEY = "llm-scores:artificial-analysis:v2:models:v1"
const MAX_PAGES = 100
const REQUEST_TIMEOUT_MS = 20_000
const EFFORT_SUFFIX_PATTERN = /-(low|medium|high|xhigh|max)$/

const nullableNumber = z.number().nullable().optional()

const modelSchema = z.object({
  name: z.string().optional(),
  slug: z.string(),
  pricing: z
    .object({
      price_1m_blended_3_to_1: nullableNumber,
      price_1m_input_tokens: nullableNumber,
      price_1m_output_tokens: nullableNumber,
    })
    .optional(),
  performance: z
    .object({
      median_output_tokens_per_second: nullableNumber,
    })
    .optional(),
})

const payloadSchema = z.object({
  data: z.array(modelSchema),
  pagination: z.object({
    has_more: z.boolean(),
  }),
})

type ArtificialAnalysisResponseModel = z.infer<typeof modelSchema>

export class ArtificialAnalysisProvider {
  readonly cacheKey = CACHE_KEY

  async fetchModels(): Promise<Array<ProviderModelData>> {
    if (!env.AA_API_KEY) throw new Error("AA_API_KEY is not configured")

    const models: Array<ProviderModelData> = []

    for (let page = 1; page <= MAX_PAGES; page += 1) {
      const response = await fetch(`${API_URL}?page=${page}`, {
        headers: { "x-api-key": env.AA_API_KEY },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      })

      if (!response.ok) {
        throw new Error(`Artificial Analysis returned ${response.status}`)
      }

      const payload = payloadSchema.parse(await response.json())

      models.push(
        ...payload.data.map((model) => {
          const effortMatch = model.slug.match(EFFORT_SUFFIX_PATTERN)
          const normalizedModel = effortMatch
            ? model.slug.slice(0, -effortMatch[0].length)
            : model.slug
          const effort = effortMatch?.[1] ?? "default"
          const config = getModelConfig(normalizedModel)

          return {
            model: normalizedModel,
            displayName: model.name ?? config.displayName,
            family: config.family,
            chartColor: config.chartColor,
            isDefault: config.isDefault,
            effort,
            effortOrder: EFFORT_ORDER[effort] ?? 0,
            score: null,
            costPerMTokens: this.getCostPerMTokens(model),
            tokensPerSecond: model.performance?.median_output_tokens_per_second ?? null,
            durationSeconds: null,
          }
        }),
      )

      if (!payload.pagination.has_more) return models
    }

    return models
  }

  private getCostPerMTokens(model: ArtificialAnalysisResponseModel) {
    const pricing = model.pricing
    const blended = pricing?.price_1m_blended_3_to_1

    if (blended != null) return blended

    const input = pricing?.price_1m_input_tokens
    const output = pricing?.price_1m_output_tokens

    return input != null && output != null ? (input * 3 + output) / 4 : null
  }
}
