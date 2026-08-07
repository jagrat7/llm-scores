import { os } from "@orpc/server"
import { z } from "zod"

import { ProviderDataService } from "../../services/provider"
import { TokenSpeedService } from "../../services/token-speed"

const tokenSpeedService = new TokenSpeedService(new ProviderDataService())
const tokenSpeedInput = z.object({
  provider: z.enum(TokenSpeedService.providers),
  model: z.string(),
  effort: z.string().optional(),
})

export const getModelTokensPerSecondProcedure = os
  .input(tokenSpeedInput)
  .handler(({ input }) =>
    tokenSpeedService.getTokensPerSecond(input.model, input.provider, input.effort),
  )
