export type ModelFamily =
  | 'anthropic'
  | 'google'
  | 'meta'
  | 'moonshot'
  | 'openai'
  | 'xai'
  | 'zhipu'
  | 'other'

type ModelConfig = {
  displayName: string
  family: ModelFamily
}

export const MODEL_CONFIG: Record<string, ModelConfig> = {
  'gpt-5-6-sol': { displayName: 'GPT-5.6 Sol', family: 'openai' },
  'gpt-5-6-terra': { displayName: 'GPT-5.6 Terra', family: 'openai' },
  'gpt-5-6-luna': { displayName: 'GPT-5.6 Luna', family: 'openai' },
  'gpt-5-5': { displayName: 'GPT-5.5', family: 'openai' },
  'gpt-5-4': { displayName: 'GPT-5.4', family: 'openai' },
  'claude-fable-5': { displayName: 'Claude Fable 5', family: 'anthropic' },
  'claude-opus-4-8': { displayName: 'Claude Opus 4.8', family: 'anthropic' },
  'claude-sonnet-5': { displayName: 'Claude Sonnet 5', family: 'anthropic' },
  'claude-sonnet-4-6': { displayName: 'Claude Sonnet 4.6', family: 'anthropic' },
  'gemini-3-1-pro-preview': { displayName: 'Gemini 3.1 Pro', family: 'google' },
  'gemini-3-5-flash': { displayName: 'Gemini 3.5 Flash', family: 'google' },
  'kimi-k2-7-code': { displayName: 'Kimi K2.7', family: 'moonshot' },
  'kimi-k3': { displayName: 'Kimi K3', family: 'moonshot' },
  'glm-5-2': { displayName: 'GLM-5.2', family: 'zhipu' },
  'grok-4-5': { displayName: 'Grok 4.5', family: 'xai' },
  'muse-spark-1-1': { displayName: 'Muse Spark 1.1', family: 'other' },
}

export const DEFAULT_MODEL_SLUGS = [
  'gpt-5-6-sol',
  'claude-fable-5',
  'gpt-5-6-terra',
  'kimi-k3',
  'gemini-3-1-pro-preview',
  'grok-4-5',
]

export const FAMILY_CHART_COLORS: Record<ModelFamily, string> = {
  openai: 'var(--chart-1)',
  anthropic: 'var(--chart-2)',
  google: 'var(--chart-3)',
  moonshot: 'var(--chart-4)',
  xai: 'var(--chart-5)',
  zhipu: 'var(--chart-6)',
  meta: 'var(--chart-7)',
  other: 'var(--chart-8)',
}

export const EFFORT_ORDER: Record<string, number> = {
  default: 0,
  low: 1,
  medium: 2,
  high: 3,
  xhigh: 4,
  max: 5,
}

export function getModelConfig(slug: string): ModelConfig {
  const inferredFamily = slug.startsWith('gpt-')
    ? 'openai'
    : slug.startsWith('claude-')
      ? 'anthropic'
      : slug.startsWith('gemini-')
        ? 'google'
        : slug.startsWith('kimi-')
          ? 'moonshot'
          : slug.startsWith('grok-')
            ? 'xai'
            : slug.startsWith('glm-')
              ? 'zhipu'
              : slug.startsWith('llama-')
                ? 'meta'
                : 'other'

  return (
    MODEL_CONFIG[slug] ?? {
      displayName: slug
        .split('-')
        .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
        .join(' '),
      family: inferredFamily,
    }
  )
}
