import { LRUCache } from "lru-cache";
import { NextRequest } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

type RateLimitOptions = {
  uniqueTokenPerInterval: number;
  interval: number; // ms
  tokensPerInterval: number;
};

type RateLimitResult = {
  success: boolean;
  remaining: number;
  resetMs: number;
};

type Limiter = {
  check(key: string): Promise<RateLimitResult> | RateLimitResult;
};

/**
 * Upstash Redis env var'ları varsa Upstash ile,
 * yoksa in-memory LRU ile çalışır.
 * Bu sayede prod'da multi-instance koruma, dev'de ek servis gerektirmez.
 */
const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

let redisClient: Redis | null = null;
if (UPSTASH_URL && UPSTASH_TOKEN) {
  try {
    redisClient = new Redis({ url: UPSTASH_URL, token: UPSTASH_TOKEN });
  } catch {
    redisClient = null;
  }
}

function createUpstashLimiter(
  prefix: string,
  interval: number,
  tokens: number,
): Limiter {
  if (!redisClient) throw new Error("no redis");
  const seconds = Math.max(1, Math.floor(interval / 1000));
  const rl = new Ratelimit({
    redis: redisClient,
    // Sliding window: 10 dakikada N istek şeklinde adil bir limit verir
    limiter: Ratelimit.slidingWindow(tokens, `${seconds} s`),
    analytics: false,
    prefix: `sr:${prefix}`,
  });
  return {
    async check(key: string): Promise<RateLimitResult> {
      const r = await rl.limit(key);
      const resetMs = Math.max(0, r.reset - Date.now());
      return { success: r.success, remaining: r.remaining, resetMs };
    },
  };
}

function createMemoryLimiter(opts: RateLimitOptions): Limiter {
  const cache = new LRUCache<string, number[]>({
    max: opts.uniqueTokenPerInterval,
    ttl: opts.interval,
  });
  return {
    check(key: string): RateLimitResult {
      const now = Date.now();
      const timestamps = cache.get(key) || [];
      const valid = timestamps.filter((t) => now - t < opts.interval);
      if (valid.length >= opts.tokensPerInterval) {
        const oldest = valid[0];
        return {
          success: false,
          remaining: 0,
          resetMs: opts.interval - (now - oldest),
        };
      }
      valid.push(now);
      cache.set(key, valid);
      return {
        success: true,
        remaining: opts.tokensPerInterval - valid.length,
        resetMs: opts.interval,
      };
    },
  };
}

export function createRateLimiter(opts: Partial<RateLimitOptions> = {}, prefix = "rl"): Limiter {
  const full: RateLimitOptions = {
    uniqueTokenPerInterval: opts.uniqueTokenPerInterval ?? 1000,
    interval: opts.interval ?? 60_000,
    tokensPerInterval: opts.tokensPerInterval ?? 10,
  };

  if (redisClient) {
    try {
      return createUpstashLimiter(prefix, full.interval, full.tokensPerInterval);
    } catch {
      // fallback
    }
  }
  return createMemoryLimiter(full);
}

/**
 * Request'ten IP adresi çıkarır. Vercel/Cloudflare header'larını destekler.
 */
export function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  const cfIp = request.headers.get("cf-connecting-ip");
  if (cfIp) return cfIp.trim();
  return "unknown";
}

// Endpoint-specific rate limiters (module-level singletons)
export const contactLimiter = createRateLimiter(
  { interval: 10 * 60_000, tokensPerInterval: 5, uniqueTokenPerInterval: 500 },
  "contact"
);

export const newsletterLimiter = createRateLimiter(
  { interval: 10 * 60_000, tokensPerInterval: 5, uniqueTokenPerInterval: 500 },
  "newsletter"
);

export const commentPostLimiter = createRateLimiter(
  { interval: 60_000, tokensPerInterval: 5, uniqueTokenPerInterval: 500 },
  "comment"
);

export const commentDeleteLimiter = createRateLimiter(
  { interval: 60_000, tokensPerInterval: 20, uniqueTokenPerInterval: 100 },
  "cdel"
);

export const searchLimiter = createRateLimiter(
  { interval: 60_000, tokensPerInterval: 60, uniqueTokenPerInterval: 1000 },
  "search"
);
