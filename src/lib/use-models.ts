import { useQueries, useQuery } from "@tanstack/react-query"
import { useMemo } from "react"

import type { Model, ProviderModel } from "./orpc-client"

import { orpc } from "./orpc-client"

const DEEPSWE = "deepswe"
const ARTIFICIAL_ANALYSIS = "artificialAnalysis"
const DEEPSWE_LABEL = "DeepSWE"
const ARTIFICIAL_ANALYSIS_LABEL = "Artificial Analysis"
const EMPTY_MODELS: Array<ProviderModel> = []

export function useModels() {
  const deepswe = useQuery(orpc.models.list.queryOptions({ input: { provider: DEEPSWE } }))
  const artificialAnalysis = useQuery(
    orpc.models.list.queryOptions({ input: { provider: ARTIFICIAL_ANALYSIS } }),
  )
  const deepsweModels = deepswe.data ?? EMPTY_MODELS
  const artificialAnalysisModels = artificialAnalysis.data ?? EMPTY_MODELS
  const hasDeepsweModels = deepsweModels.length > 0
  const providerModels = hasDeepsweModels ? deepsweModels : artificialAnalysisModels
  const artificialAnalysisByModel = useMemo(
    () =>
      new Map(artificialAnalysisModels.map((model) => [`${model.model}:${model.effort}`, model])),
    [artificialAnalysisModels],
  )
  const artificialAnalysisMatches = providerModels.map((model) => {
    const effort = model.effort === "max" ? "default" : model.effort

    return (
      artificialAnalysisByModel.get(`${model.model}:${effort}`) ??
      artificialAnalysisByModel.get(`${model.model}:default`) ??
      null
    )
  })
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
  const artificialAnalysisCosts = useQueries({
    queries: artificialAnalysisMatches.map((model, index) => ({
      ...orpc.models.costPerMTokens.queryOptions({
        input: {
          provider: ARTIFICIAL_ANALYSIS,
          model: model?.model ?? providerModels[index]?.model ?? "",
          effort: model?.effort,
        },
      }),
      enabled: model != null,
    })),
  })
  const tokensPerSecond = useQueries({
    queries: artificialAnalysisMatches.map((model, index) => ({
      ...orpc.models.tokensPerSecond.queryOptions({
        input: {
          provider: ARTIFICIAL_ANALYSIS,
          model: model?.model ?? providerModels[index]?.model ?? "",
          effort: model?.effort,
        },
      }),
      enabled: model != null,
    })),
  })
  const metricQueries = [
    ...scores,
    ...deepsweCosts,
    ...durations,
    ...artificialAnalysisCosts,
    ...tokensPerSecond,
  ]
  const isPending =
    deepswe.isPending ||
    artificialAnalysis.isPending ||
    metricQueries.some((query) => query.isFetching)
  const isError =
    deepswe.isError || artificialAnalysis.isError || metricQueries.some((query) => query.isError)
  const models = providerModels.map((model, index): Model => {
    const score = scores[index]?.data ?? null
    const deepsweCost = deepsweCosts[index]?.data ?? null
    const artificialAnalysisCost = artificialAnalysisCosts[index]?.data ?? null
    const speed = tokensPerSecond[index]?.data ?? null
    const duration = durations[index]?.data ?? null

    return {
      ...model,
      score,
      costPerMTokens: artificialAnalysisCost ?? deepsweCost,
      tokensPerSecond: speed,
      durationSeconds: duration,
      sources: {
        score: score == null ? null : DEEPSWE_LABEL,
        costPerMTokens:
          artificialAnalysisCost != null
            ? ARTIFICIAL_ANALYSIS_LABEL
            : deepsweCost == null
              ? null
              : DEEPSWE_LABEL,
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
