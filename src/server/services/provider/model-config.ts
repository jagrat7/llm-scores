export type ModelFamily =
  | "anthropic"
  | "google"
  | "meta"
  | "moonshot"
  | "openai"
  | "xai"
  | "zhipu"
  | "other"

type ModelConfig = {
  displayName: string
  family: ModelFamily
  isDefault?: boolean
}

const FAMILY_CHART_COLORS: Record<ModelFamily, string> = {
  openai: "var(--chart-1)",
  anthropic: "var(--chart-2)",
  google: "var(--chart-3)",
  moonshot: "var(--chart-4)",
  xai: "var(--chart-5)",
  zhipu: "var(--chart-6)",
  meta: "var(--chart-7)",
  other: "var(--chart-8)",
}

const MODEL_CONFIG: Record<string, ModelConfig> = {
  "gpt-5-6-sol": { displayName: "GPT-5.6 Sol", family: "openai", isDefault: true },
  "gpt-5-6-terra": { displayName: "GPT-5.6 Terra", family: "openai", isDefault: true },
  "gpt-5-6-luna": { displayName: "GPT-5.6 Luna", family: "openai" },
  "gpt-5-5": { displayName: "GPT-5.5", family: "openai" },
  "gpt-5-4": { displayName: "GPT-5.4", family: "openai" },
  "claude-fable-5": {
    displayName: "Claude Fable 5",
    family: "anthropic",
    isDefault: true,
  },
  "claude-opus-4-8": { displayName: "Claude Opus 4.8", family: "anthropic" },
  "claude-sonnet-5": { displayName: "Claude Sonnet 5", family: "anthropic" },
  "claude-sonnet-4-6": { displayName: "Claude Sonnet 4.6", family: "anthropic" },
  "gemini-3-1-pro-preview": {
    displayName: "Gemini 3.1 Pro",
    family: "google",
    isDefault: true,
  },
  "gemini-3-5-flash": { displayName: "Gemini 3.5 Flash", family: "google" },
  "kimi-k2-7-code": { displayName: "Kimi K2.7", family: "moonshot" },
  "kimi-k3": { displayName: "Kimi K3", family: "moonshot", isDefault: true },
  "glm-5-2": { displayName: "GLM-5.2", family: "zhipu" },
  "grok-4-5": { displayName: "Grok 4.5", family: "xai", isDefault: true },
  "muse-spark-1-1": { displayName: "Muse Spark 1.1", family: "other" },
}

export const EFFORT_ORDER: Record<string, number> = {
  default: 0,
  low: 1,
  medium: 2,
  high: 3,
  xhigh: 4,
  max: 5,
}

export function getModelConfig(model: string) {
  const inferredFamily = model.startsWith("gpt-")
    ? "openai"
    : model.startsWith("claude-")
      ? "anthropic"
      : model.startsWith("gemini-")
        ? "google"
        : model.startsWith("kimi-")
          ? "moonshot"
          : model.startsWith("grok-")
            ? "xai"
            : model.startsWith("glm-")
              ? "zhipu"
              : model.startsWith("llama-")
                ? "meta"
                : "other"

  const config =
    MODEL_CONFIG[model] ??
    ({
      displayName: model
        .split("-")
        .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
        .join(" "),
      family: inferredFamily,
    } satisfies ModelConfig)

  return {
    ...config,
    chartColor: FAMILY_CHART_COLORS[config.family],
    isDefault: config.isDefault ?? false,
  }
}
