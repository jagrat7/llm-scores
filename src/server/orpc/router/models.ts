import { os } from "@orpc/server"
import { z } from "zod"

import { modelsService } from "#/server/services"

export const listModelsProcedure = os.input(z.object({})).handler(() => modelsService.listModels())
