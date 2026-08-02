import { Redis } from "@upstash/redis"

let redisClient: Redis | undefined

export function getRedis() {
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  const url = process.env.UPSTASH_REDIS_REST_URL

  if (!token) return undefined
  if (!url) return undefined

  redisClient ??= new Redis({ token, url })

  return redisClient
}
