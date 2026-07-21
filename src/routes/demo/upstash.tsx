import { useState, useTransition } from 'react'
import { createServerFn } from '@tanstack/react-start'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { Database, RefreshCw, Trash2 } from 'lucide-react'

import { getRedis } from '#/lib/upstash'

const CACHE_KEY = 'llm-scores:demo:benchmark-snapshot'
const CACHE_TTL_SECONDS = 60 * 60
const PAGE_CLASS_NAME =
  'mx-auto flex w-full max-w-4xl justify-center px-4 py-10 sm:px-6 sm:py-14 lg:px-8'
const PANEL_CLASS_NAME =
  'w-full max-w-3xl rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] p-5 sm:p-8'
const PRIMARY_BUTTON_CLASS_NAME =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[var(--palm)] px-4 py-2.5 text-sm font-bold text-[var(--foam)] transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lagoon-deep)] disabled:cursor-not-allowed disabled:opacity-50'
const SECONDARY_BUTTON_CLASS_NAME =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-[var(--line)] bg-transparent px-4 py-2.5 text-sm font-bold text-[var(--sea-ink)] transition hover:bg-[var(--link-bg-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lagoon-deep)] disabled:cursor-not-allowed disabled:opacity-50'
const CACHE_ROW_CLASS_NAME =
  'grid grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)] gap-4 py-3 text-sm'
const CACHE_STATUS_LABELS = {
  error: 'Connection error',
  hit: 'Cache hit',
  miss: 'Cache miss',
}
const CACHE_STATUS_DOT_CLASS_NAMES = {
  error: 'bg-destructive',
  hit: 'bg-[var(--palm)]',
  miss: 'bg-[var(--sea-ink-soft)]',
}
const SAMPLE_SNAPSHOT = {
  model: 'Demo Model',
  benchmark: 'Example Benchmark',
  score: 87.4,
  source: 'Upstash demo data',
}

type BenchmarkSnapshot = typeof SAMPLE_SNAPSHOT & {
  cachedAt: string
}

const getCacheState = createServerFn({ method: 'GET' }).handler(async () => {
  const redis = getRedis()

  if (!redis) {
    return { status: 'unconfigured' as const }
  }

  try {
    const [snapshot, ttl] = await Promise.all([
      redis.get<BenchmarkSnapshot>(CACHE_KEY),
      redis.ttl(CACHE_KEY),
    ])

    return {
      status: snapshot ? ('hit' as const) : ('miss' as const),
      snapshot,
      ttl: ttl > 0 ? ttl : undefined,
    }
  } catch (error) {
    return {
      status: 'error' as const,
      message: error instanceof Error ? error.message : 'Unable to reach Upstash',
    }
  }
})

const refreshCache = createServerFn({ method: 'POST' }).handler(async () => {
  const redis = getRedis()

  if (!redis) throw new Error('Upstash is not configured')

  const snapshot: BenchmarkSnapshot = {
    ...SAMPLE_SNAPSHOT,
    cachedAt: new Date().toISOString(),
  }

  await redis.set(CACHE_KEY, snapshot, { ex: CACHE_TTL_SECONDS })
})

const clearCache = createServerFn({ method: 'POST' }).handler(async () => {
  const redis = getRedis()

  if (!redis) throw new Error('Upstash is not configured')

  await redis.del(CACHE_KEY)
})

export const Route = createFileRoute('/demo/upstash')({
  component: UpstashDemo,
  loader: async () => await getCacheState(),
})

function UpstashDemo() {
  const cacheState = Route.useLoaderData()
  const router = useRouter()
  const [error, setError] = useState<string>()
  const [isPending, startTransition] = useTransition()

  const handleAction = (action: () => Promise<unknown>) => {
    setError(undefined)
    startTransition(async () => {
      try {
        await action()
        await router.invalidate()
      } catch (actionError) {
        setError(
          actionError instanceof Error
            ? actionError.message
            : 'The cache action failed',
        )
      }
    })
  }

  if (cacheState.status === 'unconfigured') {
    return (
      <main className={PAGE_CLASS_NAME}>
        <section className={PANEL_CLASS_NAME}>
          <DemoHeader />
          <div className="mt-8 border-t border-[var(--line)] pt-6">
            <h2 className="text-base font-bold text-[var(--sea-ink)]">
              Connect your Upstash database
            </h2>
            <p className="mt-2 max-w-[65ch] text-sm leading-6 text-[var(--sea-ink-soft)]">
              Add these server-only credentials to <code>.env.local</code>, then
              restart the development server.
            </p>
            <ol className="mt-5 list-inside list-decimal space-y-3 text-sm text-[var(--sea-ink-soft)] marker:font-bold marker:text-[var(--palm)]">
              <li>Create a free Redis database in the Upstash console</li>
              <li>
                Set <code>UPSTASH_REDIS_REST_URL</code>
              </li>
              <li>
                Set <code>UPSTASH_REDIS_REST_TOKEN</code>
              </li>
            </ol>
          </div>
        </section>
      </main>
    )
  }

  const statusLabel = CACHE_STATUS_LABELS[cacheState.status]
  const statusDotClassName = CACHE_STATUS_DOT_CLASS_NAMES[cacheState.status]

  return (
    <main className={PAGE_CLASS_NAME}>
      <section className={PANEL_CLASS_NAME}>
        <DemoHeader />

        <div className="mt-8 flex flex-wrap items-start justify-between gap-4 border-t border-[var(--line)] pt-6">
          <div>
            <h2 className="text-base font-bold text-[var(--sea-ink)]">
              Benchmark cache
            </h2>
            <p className="mt-1 text-sm leading-6 text-[var(--sea-ink-soft)]">
              One JSON snapshot stored for {CACHE_TTL_SECONDS / 60} minutes.
            </p>
          </div>
          <span className="inline-flex min-h-8 items-center gap-2 rounded-full border border-[var(--chip-line)] bg-[var(--chip-bg)] px-3 text-xs font-bold text-[var(--sea-ink)]">
            <span
              className={`h-2 w-2 rounded-full ${statusDotClassName}`}
              aria-hidden="true"
            />
            {statusLabel}
          </span>
        </div>

        {cacheState.status === 'error' ? (
          <div
            className="mt-6 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm"
            role="alert"
          >
            <p className="font-bold text-[var(--sea-ink)]">
              Could not reach Upstash
            </p>
            <p className="mt-1 text-[var(--sea-ink-soft)]">
              {cacheState.message}
            </p>
          </div>
        ) : cacheState.snapshot ? (
          <dl className="mt-6 divide-y divide-[var(--line)] border-y border-[var(--line)]">
            <div className={CACHE_ROW_CLASS_NAME}>
              <dt className="text-[var(--sea-ink-soft)]">Model</dt>
              <dd className="font-semibold text-[var(--sea-ink)]">
                {cacheState.snapshot.model}
              </dd>
            </div>
            <div className={CACHE_ROW_CLASS_NAME}>
              <dt className="text-[var(--sea-ink-soft)]">Benchmark</dt>
              <dd className="font-semibold text-[var(--sea-ink)]">
                {cacheState.snapshot.benchmark}
              </dd>
            </div>
            <div className={CACHE_ROW_CLASS_NAME}>
              <dt className="text-[var(--sea-ink-soft)]">Score</dt>
              <dd className="font-semibold text-[var(--sea-ink)]">
                {cacheState.snapshot.score}
              </dd>
            </div>
            <div className={CACHE_ROW_CLASS_NAME}>
              <dt className="text-[var(--sea-ink-soft)]">Expires in</dt>
              <dd className="font-semibold text-[var(--sea-ink)]">
                {cacheState.ttl ?? 0} seconds
              </dd>
            </div>
            <div className={CACHE_ROW_CLASS_NAME}>
              <dt className="text-[var(--sea-ink-soft)]">Cached at</dt>
              <dd className="text-[var(--sea-ink)]">
                <time dateTime={cacheState.snapshot.cachedAt}>
                  {cacheState.snapshot.cachedAt
                    .replace('T', ' ')
                    .replace('.000Z', ' UTC')}
                </time>
              </dd>
            </div>
          </dl>
        ) : (
          <div className="mt-6 rounded-xl border border-dashed border-[var(--line)] px-4 py-10 text-center">
            <Database
              className="mx-auto h-6 w-6 text-[var(--palm)]"
              aria-hidden="true"
            />
            <p className="mt-3 font-bold text-[var(--sea-ink)]">
              No cached snapshot
            </p>
            <p className="mt-1 text-sm text-[var(--sea-ink-soft)]">
              Store the sample to see a Redis cache hit.
            </p>
          </div>
        )}

        {error ? (
          <p className="mt-4 text-sm font-semibold text-destructive" role="alert">
            {error}
          </p>
        ) : undefined}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            className={PRIMARY_BUTTON_CLASS_NAME}
            disabled={isPending}
            onClick={() => handleAction(() => refreshCache())}
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            {isPending ? 'Updating…' : 'Store sample'}
          </button>
          <button
            type="button"
            className={SECONDARY_BUTTON_CLASS_NAME}
            disabled={isPending ? true : cacheState.status !== 'hit'}
            onClick={() => handleAction(() => clearCache())}
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            Clear cache
          </button>
        </div>
      </section>
    </main>
  )
}

function DemoHeader() {
  return (
    <header className="flex items-center gap-4">
      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-[var(--chip-line)] bg-[var(--chip-bg)] text-[var(--palm)]">
        <Database className="h-6 w-6" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-[var(--palm)]">Upstash Redis</p>
        <h1 className="mt-1 text-xl font-bold tracking-[-0.025em] text-[var(--sea-ink)] text-balance sm:text-2xl">
          Cache demo
        </h1>
      </div>
    </header>
  )
}
