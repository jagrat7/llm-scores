import { EFFORT_ORDER, getModelConfig } from "#/shared/model-config"
import { MODEL_SOURCES, type JoinedModel, type ModelsResponse } from "#/shared/models"

import type { ArtificialAnalysisModel } from "./artificial-analysis"
import type { DeepSWEModel } from "./deep-swe"
import { ProviderService } from "./provider-service"

export class ModelsService {
  constructor(private readonly providerService = new ProviderService()) {}

  async listModels(): Promise<ModelsResponse> {
    const { deepswe, artificialAnalysis } = await this.providerService.fetchModels()
    const sources = [deepswe, artificialAnalysis]
    const fetchedTimes = sources.map((source) => new Date(source.fetchedAt).getTime())
    const oldestFetch = Math.min(...fetchedTimes)
    const wasCached = sources.some((source) => source.fromCache)

    return {
      models: this.joinModels(deepswe.data, artificialAnalysis.data ?? []),
      fetchedAt: new Date(oldestFetch).toISOString(),
      cacheAgeSeconds: wasCached
        ? Math.max(0, Math.floor((Date.now() - oldestFetch) / 1000))
        : null,
      sources: {
        deepswe: deepswe.status,
        artificialAnalysis: artificialAnalysis.status,
      },
    }
  }

  joinModels(
    deepsweModels: Array<DeepSWEModel> | null,
    artificialAnalysisModels: Array<ArtificialAnalysisModel>,
  ) {
    if (!deepsweModels) {
      return artificialAnalysisModels.map((model): JoinedModel => {
        const config = getModelConfig(model.slug)

        return {
          slug: model.slug,
          displayName: model.displayName ?? config.displayName,
          family: config.family,
          effort: model.effort,
          score: null,
          costPerMTokens: model.costPerMTokens,
          tokensPerSecond: model.tokensPerSecond,
          durationSeconds: null,
          sources: {
            score: null,
            costPerMTokens: model.costPerMTokens == null ? null : MODEL_SOURCES.artificialAnalysis,
            tokensPerSecond:
              model.tokensPerSecond == null ? null : MODEL_SOURCES.artificialAnalysis,
            durationSeconds: null,
          },
        }
      })
    }

    const artificialAnalysisBySlug = new Map(
      artificialAnalysisModels.map((model) => [model.providerSlug, model]),
    )

    return (
      deepsweModels
        .map((model): JoinedModel => {
          const effortSlug = ["default", "max"].includes(model.effort)
            ? model.slug
            : `${model.slug}-${model.effort}`
          const artificialAnalysisModel =
            artificialAnalysisBySlug.get(effortSlug) ?? artificialAnalysisBySlug.get(model.slug)
          const config = getModelConfig(model.slug)
          const costPerMTokens = artificialAnalysisModel?.costPerMTokens ?? model.costPerMTokens
          const tokensPerSecond = artificialAnalysisModel?.tokensPerSecond ?? null

          return {
            slug: model.slug,
            displayName: config.displayName,
            family: config.family,
            effort: model.effort,
            score: model.score,
            costPerMTokens,
            tokensPerSecond,
            durationSeconds: model.durationSeconds,
            sources: {
              score: MODEL_SOURCES.deepswe,
              costPerMTokens:
                costPerMTokens == null
                  ? null
                  : artificialAnalysisModel?.costPerMTokens == null
                    ? MODEL_SOURCES.deepswe
                    : MODEL_SOURCES.artificialAnalysis,
              tokensPerSecond: tokensPerSecond == null ? null : MODEL_SOURCES.artificialAnalysis,
              durationSeconds: model.durationSeconds == null ? null : MODEL_SOURCES.deepswe,
            },
          }
        })
        // oxlint-disable-next-line unicorn/no-array-sort -- ES2022 does not include Array#toSorted
        .sort((left, right) => {
          const modelOrder = (right.score ?? 0) - (left.score ?? 0)

          return modelOrder !== 0
            ? modelOrder
            : (EFFORT_ORDER[left.effort] ?? 0) - (EFFORT_ORDER[right.effort] ?? 0)
        })
    )
  }
}
