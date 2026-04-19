import { LRUCache } from "lru-cache";
import { NextRequest } from "next/server";

type RateLimitOptions = {
  uniqueTokenPerInterval: number;
  interval: number; // ms
  tokensPerInterval: number; // istek sayısı
};

type RateLimitResult = {
  success: boolean;
  remaining: number;
  resetMs: number;
};

/**
 * Basit IP-bazlı rate limiter. LRU cache ile in-memory tutar.
 * Tek instance için çalışır — Vercel serverless'ta her instance'ta ayrı cache olur,
 * ama trafik düşükse yeterli koruma sağlar. Yüksek trafikte Upstash/Redis'e geçilebilir.
 */
export function createRateLimiter({
  uniqueTokenPerInterval = 1000,
  interval = 60_000,
  tokensPerInterval = 10,
}: Partial<RateLimitOptions> = {}) {
  const cache = new LRUCache<string, number[]>({
    max: uniqueTokenPerInterval,
    ttl: interval,
  });

  return {
    check(key: string): RateLimitResult {
      const now = Date.now();
      const timestamps = cache.get(key) || [];
      // Eski (expire olmuş) timestamp'leri temizle
      const valid = timestamps.filter((t) => now - t < interval);

      if (valid.length >= tokensPerInterval) {
        const oldest = valid[0];
        return {
          success: false,
          remaining: 0,
          resetMs: interval - (now - oldest),
        };
      }

      valid.push(now);
      cache.set(key, valid);

      return {
        success: true,
        remaining: tokensPerInterval - valid.length,
        resetMs: interval,
      };
    },
  };
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
export const contactLimiter = createRateLimiter({
  interval: 10 * 60_000, // 10 dakika
  tokensPerInterval: 5, // 5 istek
  uniqueTokenPerInterval: 500,
});

export const newsletterLimiter = createRateLimiter({
  interval: 10 * 60_000, // 10 dakika
  tokensPerInterval: 5, // 5 istek
  uniqueTokenPerInterval: 500,
});

export const commentPostLimiter = createRateLimiter({
  interval: 60_000, // 1 dakika
  tokensPerInterval: 5, // 5 yorum/dk
  uniqueTokenPerInterval: 500,
});

export const commentDeleteLimiter = createRateLimiter({
  interval: 60_000,
  tokensPerInterval: 20, // admin daha rahat
  uniqueTokenPerInterval: 100,
});
