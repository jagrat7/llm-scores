import { os } from "@orpc/server"
import { z } from "zod"

import { CostService } from "../../services/cost"
import { ProviderDataService } from "../../services/provider"

const costService = new CostService(new ProviderDataService())
const costInput = z.object({
  provider: z.enum(CostService.providers),
  model: z.string(),
  effort: z.string().optional(),
})

export const getModelCostProcedure = os
  .input(costInput)
  .handler(({ input }) => costService.getCostPerMTokens(input.model, input.provider, input.effort))
