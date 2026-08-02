import { Redis } from "@upstash/redis"

import type { SourceStatus } from "#/shared/models"

const CACHE_TTL_SECONDS = 60 * 60
const STALE_TTL_SECONDS = 24 * 60 * 60

type CacheEntry<T> = {
  data: T
  fetchedAt: string
}

export type CachedSource<T> = {
  data: T | null
  fetchedAt: string
  fromCache: boolean
  status: SourceStatus
}

export class CacheService {
  private redisClient: Redis | undefined

  constructor(
    private readonly cacheTtlSeconds = CACHE_TTL_SECONDS,
    private readonly staleTtlSeconds = STALE_TTL_SECONDS,
  ) {}

  async fetch<T>(key: string, fetcher: () => Promise<T>): Promise<CachedSource<T>> {
    const cached = await this.get<T>(key)
    if (cached) return { ...cached, fromCache: true, status: "ok" }

    try {
      const data = await fetcher()
      const entry = { data, fetchedAt: new Date().toISOString() }
      await this.set(key, entry)

      return { ...entry, fromCache: false, status: "ok" }
    } catch {
      const stale = await this.get<T>(`${key}:stale`)
      if (stale) return { ...stale, fromCache: true, status: "error" }

      return {
        data: null,
        fetchedAt: new Date().toISOString(),
        fromCache: false,
        status: "error",
      }
    }
  }

  private getRedis() {
    const token = process.env.UPSTASH_REDIS_REST_TOKEN
    const url = process.env.UPSTASH_REDIS_REST_URL

    if (!token || !url) return undefined

    this.redisClient ??= new Redis({ token, url })

    return this.redisClient
  }

  private async get<T>(key: string) {
    const redis = this.getRedis()
    if (!redis) return null

    try {
      return await redis.get<CacheEntry<T>>(key)
    } catch {
      return null
    }
  }

  private async set<T>(key: string, entry: CacheEntry<T>) {
    const redis = this.getRedis()
    if (!redis) return

    await Promise.allSettled([
      redis.set(key, entry, { ex: this.cacheTtlSeconds }),
      redis.set(`${key}:stale`, entry, { ex: this.staleTtlSeconds }),
    ])
  }
}
