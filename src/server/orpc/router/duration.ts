import { os } from "@orpc/server"
import { z } from "zod"

import { DurationService } from "../../services/duration"

import { ProviderDataService } from "../../services/provider"

const durationService = new DurationService(new ProviderDataService())
const durationInput = z.object({
  provider: z.enum(DurationService.providers),
  model: z.string(),
  effort: z.string().optional(),
})

export const getModelDurationProcedure = os
  .input(durationInput)
  .handler(({ input }) =>
    durationService.getDurationSeconds(input.model, input.provider, input.effort),
  )
