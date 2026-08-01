import { z } from 'zod'

import { EFFORT_ORDER, getModelConfig } from '#/shared/model-config'
import { env } from '#/env'
import type { JoinedModel, ModelsResponse, SourceStatus } from '#/shared/models'

import { getRedis } from '#/server/services/cache'

const DEEPSWE_URL = 'https://deepswe.datacurve.ai/artifacts/v1.1/leaderboard-live.json'
const AA_URL = 'https://artificialanalysis.ai/api/v2/language/models/free'
const CACHE_TTL_SECONDS = 60 * 60
const STALE_TTL_SECONDS = 24 * 60 * 60
const MAX_AA_PAGES = 100

const nullableNumber = z.number().nullable().optional()

const deepsweRowSchema = z.object({
  model: z.string(),
  pass_rate: z.number(),
  reasoning_effort: z.string().nullable().optional(),
  mean_duration_seconds: nullableNumber,
  mean_input_tokens: nullableNumber,
  mean_output_tokens: nullableNumber,
  mean_cost_usd: nullableNumber,
})

const deepswePayloadSchema = z.object({
  rows: z.array(deepsweRowSchema),
})

const aaModelSchema = z.object({
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

const aaPayloadSchema = z.object({
  data: z.array(aaModelSchema),
  pagination: z.object({
    has_more: z.boolean(),
  }),
})

type DeepSWEData = z.infer<typeof deepswePayloadSchema>
type AAModel = z.infer<typeof aaModelSchema>

type CacheEntry<T> = {
  data: T
  fetchedAt: string
}

type SourceResult<T> = CacheEntry<T> & {
  fromCache: boolean
  status: SourceStatus
}

function getBlendedPrice(model: AAModel | undefined) {
  const pricing = model?.pricing
  const blended = pricing?.price_1m_blended_3_to_1

  if (blended != null) return blended

  const input = pricing?.price_1m_input_tokens
  const output = pricing?.price_1m_output_tokens

  return input != null && output != null ? (input * 3 + output) / 4 : null
}

function getDeepSWECostPerMTokens(row: z.infer<typeof deepsweRowSchema>) {
  const cost = row.mean_cost_usd
  const tokens = (row.mean_input_tokens ?? 0) + (row.mean_output_tokens ?? 0)

  return cost != null && tokens > 0 ? (cost / tokens) * 1_000_000 : null
}

export function joinModelData(deepswe: DeepSWEData | null, aaModels: Array<AAModel>) {
  if (!deepswe) {
    return aaModels.map((model): JoinedModel => {
      const effortMatch = model.slug.match(/-(low|medium|high|xhigh|max)$/)
      const effort = effortMatch?.[1] ?? 'default'
      const baseSlug = effortMatch ? model.slug.slice(0, -effortMatch[0].length) : model.slug
      const config = getModelConfig(baseSlug)
      const costPerMTokens = getBlendedPrice(model)
      const tokensPerSecond = model.performance?.median_output_tokens_per_second ?? null

      return {
        slug: baseSlug,
        displayName: model.name ?? config.displayName,
        family: config.family,
        effort,
        score: null,
        costPerMTokens,
        tokensPerSecond,
        durationSeconds: null,
        sources: {
          score: null,
          costPerMTokens: costPerMTokens == null ? null : 'Artificial Analysis',
          tokensPerSecond: tokensPerSecond == null ? null : 'Artificial Analysis',
          durationSeconds: null,
        },
      }
    })
  }

  const aaBySlug = new Map(aaModels.map((model) => [model.slug, model]))

  return deepswe.rows
    .map((row): JoinedModel => {
      const effort = row.reasoning_effort ?? 'default'
      const effortSlug = ['default', 'max'].includes(effort) ? row.model : `${row.model}-${effort}`
      const aaModel = aaBySlug.get(effortSlug) ?? aaBySlug.get(row.model)
      const config = getModelConfig(row.model)
      const aaCostPerMTokens = getBlendedPrice(aaModel)
      const costPerMTokens = aaCostPerMTokens ?? getDeepSWECostPerMTokens(row)
      const tokensPerSecond = aaModel?.performance?.median_output_tokens_per_second ?? null

      return {
        slug: row.model,
        displayName: config.displayName,
        family: config.family,
        effort,
        score: row.pass_rate * 100,
        costPerMTokens,
        tokensPerSecond,
        durationSeconds: row.mean_duration_seconds ?? null,
        sources: {
          score: 'DeepSWE',
          costPerMTokens:
            costPerMTokens == null
              ? null
              : aaCostPerMTokens == null
                ? 'DeepSWE'
                : 'Artificial Analysis',
          tokensPerSecond: tokensPerSecond == null ? null : 'Artificial Analysis',
          durationSeconds: row.mean_duration_seconds == null ? null : 'DeepSWE',
        },
      }
    })
    .sort((left, right) => {
      const modelOrder = (right.score ?? 0) - (left.score ?? 0)
      return modelOrder !== 0
        ? modelOrder
        : (EFFORT_ORDER[left.effort] ?? 0) - (EFFORT_ORDER[right.effort] ?? 0)
    })
}

async function getCacheEntry<T>(key: string) {
  const redis = getRedis()
  if (!redis) return null

  try {
    return await redis.get<CacheEntry<T>>(key)
  } catch {
    return null
  }
}

async function setCacheEntry<T>(key: string, entry: CacheEntry<T>) {
  const redis = getRedis()
  if (!redis) return

  await Promise.allSettled([
    redis.set(key, entry, { ex: CACHE_TTL_SECONDS }),
    redis.set(`${key}:stale`, entry, { ex: STALE_TTL_SECONDS }),
  ])
}

async function fetchCachedSource<T>(
  key: string,
  fetcher: () => Promise<T>,
): Promise<SourceResult<T | null>> {
  const cached = await getCacheEntry<T>(key)
  if (cached) return { ...cached, fromCache: true, status: 'ok' }

  try {
    const data = await fetcher()
    const entry = { data, fetchedAt: new Date().toISOString() }
    await setCacheEntry(key, entry)
    return { ...entry, fromCache: false, status: 'ok' }
  } catch {
    const stale = await getCacheEntry<T>(`${key}:stale`)
    if (stale) return { ...stale, fromCache: true, status: 'error' }

    return {
      data: null,
      fetchedAt: new Date().toISOString(),
      fromCache: false,
      status: 'error',
    }
  }
}

async function fetchDeepSWE() {
  const response = await fetch(DEEPSWE_URL, {
    signal: AbortSignal.timeout(20_000),
  })
  if (!response.ok) throw new Error(`DeepSWE returned ${response.status}`)
  return deepswePayloadSchema.parse(await response.json())
}

async function fetchArtificialAnalysis() {
  if (!env.AA_API_KEY) throw new Error('AA_API_KEY is not configured')

  const models: Array<AAModel> = []

  for (let page = 1; page <= MAX_AA_PAGES; page += 1) {
    const response = await fetch(`${AA_URL}?page=${page}`, {
      headers: { 'x-api-key': env.AA_API_KEY },
      signal: AbortSignal.timeout(20_000),
    })
    if (!response.ok) {
      throw new Error(`Artificial Analysis returned ${response.status}`)
    }

    const payload = aaPayloadSchema.parse(await response.json())
    models.push(...payload.data)
    if (!payload.pagination.has_more) return models
  }

  return models
}

export async function listModels(): Promise<ModelsResponse> {
  const [deepswe, artificialAnalysis] = await Promise.all([
    fetchCachedSource<DeepSWEData>('llm-scores:deepswe:v1.1', fetchDeepSWE),
    fetchCachedSource<Array<AAModel>>('llm-scores:artificial-analysis:v2', fetchArtificialAnalysis),
  ])

  const sourceEntries = [deepswe, artificialAnalysis]
  const fetchedTimes = sourceEntries.map((source) => new Date(source.fetchedAt).getTime())
  const oldestFetch = Math.min(...fetchedTimes)
  const wasCached = sourceEntries.some((source) => source.fromCache)

  return {
    models: joinModelData(deepswe.data, artificialAnalysis.data ?? []),
    fetchedAt: new Date(oldestFetch).toISOString(),
    cacheAgeSeconds: wasCached ? Math.max(0, Math.floor((Date.now() - oldestFetch) / 1000)) : null,
    sources: {
      deepswe: deepswe.status,
      artificialAnalysis: artificialAnalysis.status,
    },
  }
}
