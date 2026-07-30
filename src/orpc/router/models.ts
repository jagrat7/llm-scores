import { os } from '@orpc/server'
import { z } from 'zod'
import { listModels } from '#/lib/model-data'

export const listModelsProcedure = os
  .input(z.object({}))
  .handler(() => listModels())
