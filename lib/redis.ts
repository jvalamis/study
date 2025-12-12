import { Redis } from "@upstash/redis"

// Initialize Redis client from environment variables
// Supports both UPSTASH_* and legacy KV_* environment variables
const getRedisConfig = () => {
  // Try new Upstash format first (UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN)
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    return {
      url: process.env.UPSTASH_REDIS_REST_URL.trim(),
      token: process.env.UPSTASH_REDIS_REST_TOKEN.trim(),
    }
  }
  
  // Fall back to legacy KV format (KV_REST_API_URL, KV_REST_API_TOKEN)
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    return {
      url: process.env.KV_REST_API_URL.trim(),
      token: process.env.KV_REST_API_TOKEN.trim(),
    }
  }
  
  // Last resort: try Redis.fromEnv() which reads UPSTASH_* vars
  return null
}

const config = getRedisConfig()
export const redis = config 
  ? new Redis({ url: config.url, token: config.token })
  : Redis.fromEnv()

