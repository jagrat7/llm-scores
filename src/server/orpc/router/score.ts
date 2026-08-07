import { os } from "@orpc/server"
import { z } from "zod"

import { ProviderDataService } from "../../services/provider"
import { ScoreService } from "../../services/score"

const scoreService = new ScoreService(new ProviderDataService())
const scoreInput = z.object({
  provider: z.enum(ScoreService.providers),
  model: z.string(),
  effort: z.string().optional(),
})

export const getModelScoreProcedure = os
  .input(scoreInput)
  .handler(({ input }) => scoreService.getScore(input.model, input.provider, input.effort))
