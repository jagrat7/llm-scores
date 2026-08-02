import { os } from "@orpc/server"
import { z } from "zod"

import { ProviderDataService } from "../../services/provider"
import { PROVIDERS, type ProviderName } from "../../services/provider/provider.types"

const providerDataService = new ProviderDataService()
const providerInput = z.object({
  provider: z.string().refine((value): value is ProviderName => value in PROVIDERS),
})
const metricInput = providerInput.extend({
  model: z.string(),
  effort: z.string().optional(),
})

export const listProviderModelsProcedure = os
  .input(providerInput)
  .handler(({ input }) => providerDataService.listModels(input.provider))

export const getModelScoreProcedure = os
  .input(metricInput)
  .handler(({ input }) => providerDataService.getScore(input.model, input.provider, input.effort))

export const getModelCostProcedure = os
  .input(metricInput)
  .handler(({ input }) =>
    providerDataService.getCostPerMTokens(input.model, input.provider, input.effort),
  )

export const getModelTokensPerSecondProcedure = os
  .input(metricInput)
  .handler(({ input }) =>
    providerDataService.getTokensPerSecond(input.model, input.provider, input.effort),
  )

export const getModelDurationProcedure = os
  .input(metricInput)
  .handler(({ input }) =>
    providerDataService.getDurationSeconds(input.model, input.provider, input.effort),
  )
