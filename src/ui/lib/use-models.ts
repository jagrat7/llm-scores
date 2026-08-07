import { useQueries, useQuery } from "@tanstack/react-query"
import { useMemo } from "react"

import type { Model, ProviderModel } from "./orpc-client"

import { orpc } from "./orpc-client"

const DEEPSWE = "deepswe"
const ARTIFICIAL_ANALYSIS = "artificialAnalysis"
const DEEPSWE_LABEL = "DeepSWE"
const ARTIFICIAL_ANALYSIS_LABEL = "Artificial Analysis"
const EMPTY_MODELS: Array<ProviderModel> = []

function getModelKey(model: ProviderModel) {
  return `${model.model}:${model.effort}`
}

function dedupeModels(models: Array<ProviderModel>) {
  return Array.from(new Map(models.map((model) => [getModelKey(model), model])).values())
}

export function useModels() {
  const deepswe = useQuery(orpc.models.list.queryOptions({ input: { provider: DEEPSWE } }))
  const artificialAnalysis = useQuery(
    orpc.models.list.queryOptions({ input: { provider: ARTIFICIAL_ANALYSIS } }),
  )
  const deepsweModels = useMemo(() => dedupeModels(deepswe.data ?? EMPTY_MODELS), [deepswe.data])
  const artificialAnalysisModels = useMemo(
    () => dedupeModels(artificialAnalysis.data ?? EMPTY_MODELS),
    [artificialAnalysis.data],
  )
  const hasDeepsweModels = deepsweModels.length > 0
  const providerModels = hasDeepsweModels ? deepsweModels : artificialAnalysisModels
  const artificialAnalysisByModel = useMemo(
    () => new Map(artificialAnalysisModels.map((model) => [getModelKey(model), model])),
    [artificialAnalysisModels],
  )
  const artificialAnalysisMatches = useMemo(
    () =>
      providerModels.map((model) => {
        const effort = model.effort === "max" ? "default" : model.effort

        return (
          artificialAnalysisByModel.get(`${model.model}:${effort}`) ??
          artificialAnalysisByModel.get(`${model.model}:default`) ??
          null
        )
      }),
    [artificialAnalysisByModel, providerModels],
  )
  const artificialAnalysisQueryModels = useMemo(
    () =>
      dedupeModels(
        artificialAnalysisMatches.filter((model): model is ProviderModel => model != null),
      ),
    [artificialAnalysisMatches],
  )
  const artificialAnalysisQueryIndex = useMemo(
    () => new Map(artificialAnalysisQueryModels.map((model, index) => [getModelKey(model), index])),
    [artificialAnalysisQueryModels],
  )
  const scores = useQueries({
    queries: providerModels.map((model) => ({
      ...orpc.models.score.queryOptions({
        input: { provider: DEEPSWE, model: model.model, effort: model.effort },
      }),
      enabled: hasDeepsweModels,
    })),
  })
  const deepsweCosts = useQueries({
    queries: providerModels.map((model) => ({
      ...orpc.models.costPerMTokens.queryOptions({
        input: { provider: DEEPSWE, model: model.model, effort: model.effort },
      }),
      enabled: hasDeepsweModels,
    })),
  })
  const durations = useQueries({
    queries: providerModels.map((model) => ({
      ...orpc.models.durationSeconds.queryOptions({
        input: { provider: DEEPSWE, model: model.model, effort: model.effort },
      }),
      enabled: hasDeepsweModels,
    })),
  })
  const tokensPerSecond = useQueries({
    queries: artificialAnalysisQueryModels.map((model) =>
      orpc.models.tokensPerSecond.queryOptions({
        input: {
          provider: ARTIFICIAL_ANALYSIS,
          model: model.model,
          effort: model.effort,
        },
      }),
    ),
  })
  const metricQueries = [...scores, ...deepsweCosts, ...durations, ...tokensPerSecond]
  const isPending =
    deepswe.isPending ||
    artificialAnalysis.isPending ||
    metricQueries.some((query) => query.isFetching)
  const isError =
    deepswe.isError || artificialAnalysis.isError || metricQueries.some((query) => query.isError)
  const models = providerModels.map((model, index): Model => {
    const artificialAnalysisModel = artificialAnalysisMatches[index]
    const artificialAnalysisIndex = artificialAnalysisModel
      ? artificialAnalysisQueryIndex.get(getModelKey(artificialAnalysisModel))
      : undefined
    const score = scores[index]?.data ?? null
    const deepsweCost = deepsweCosts[index]?.data ?? null
    const speed =
      artificialAnalysisIndex == null
        ? null
        : (tokensPerSecond[artificialAnalysisIndex]?.data ?? null)
    const duration = durations[index]?.data ?? null

    return {
      ...model,
      score,
      costPerMTokens: deepsweCost,
      tokensPerSecond: speed,
      durationSeconds: duration,
      sources: {
        score: score == null ? null : DEEPSWE_LABEL,
        costPerMTokens: deepsweCost == null ? null : DEEPSWE_LABEL,
        tokensPerSecond: speed == null ? null : ARTIFICIAL_ANALYSIS_LABEL,
        durationSeconds: duration == null ? null : DEEPSWE_LABEL,
      },
    }
  })
  // oxlint-disable-next-line unicorn/no-array-sort -- ES2022 does not include Array#toSorted
  models.sort((left, right) => {
    const scoreOrder = (right.score ?? 0) - (left.score ?? 0)

    return scoreOrder !== 0 ? scoreOrder : left.effortOrder - right.effortOrder
  })

  return {
    data: isPending
      ? undefined
      : {
          models,
          defaultModels: Array.from(
            new Set(models.filter((model) => model.isDefault).map((model) => model.model)),
          ),
        },
    isPending,
    isError,
  }
}
