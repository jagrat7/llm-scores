import {
  getModelCostProcedure,
  getModelDurationProcedure,
  getModelScoreProcedure,
  getModelTokensPerSecondProcedure,
  listProviderModelsProcedure,
} from "./models"

export default {
  models: {
    list: listProviderModelsProcedure,
    score: getModelScoreProcedure,
    costPerMTokens: getModelCostProcedure,
    tokensPerSecond: getModelTokensPerSecondProcedure,
    durationSeconds: getModelDurationProcedure,
  },
}
