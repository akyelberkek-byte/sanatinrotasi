/**
 * Basit ziyaretçi sayacı — Upstash Redis kullanır.
 * Kurulum yoksa no-op çalışır (getStats null döner, admin panelde CTA gösterilir).
 *
 * Neden Upstash?
 * - Vercel serverless'ta instance'lar arası paylaşılan sayaç
 * - Hobby (free) tier'de 10k komut/gün limit yeterli (normal trafikte)
 * - Zaten rateLimit.ts için entegre edilmişti
 *
 * Key şeması:
 *   pv:total                → toplam (life-time) sayfa görüntüleme
 *   pv:day:YYYY-MM-DD       → günlük (90 gün TTL)
 *   pv:month:YYYY-MM        → aylık (400 gün TTL)
 *   pv:path:<path>:YYYY-MM-DD → sayfa bazlı günlük (30 gün TTL)
 */

import { Redis } from "@upstash/redis";

const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

let redis: Redis | null = null;
if (UPSTASH_URL && UPSTASH_TOKEN) {
  try {
    redis = new Redis({ url: UPSTASH_URL, token: UPSTASH_TOKEN });
  } catch {
    redis = null;
  }
}

export const analyticsEnabled = redis !== null;

// Tarihler — UTC bazlı, gün/ay anahtarları için
function ymd(d = new Date()): string {
  return d.toISOString().slice(0, 10); // "2026-04-22"
}
function ym(d = new Date()): string {
  return d.toISOString().slice(0, 7); // "2026-04"
}

/**
 * Sayfa görüntüleme kaydet. path boşsa sadece total+day+month artar.
 * Best-effort: Redis hatası sessizce yutulur, siteyi kırmaz.
 */
export async function trackPageView(path?: string): Promise<void> {
  if (!redis) return;
  try {
    const today = ymd();
    const month = ym();
    const ops: Promise<unknown>[] = [
      redis.incr("pv:total"),
      redis.incr(`pv:day:${today}`),
      redis.incr(`pv:month:${month}`),
    ];
    await Promise.all(ops);

    // TTL'leri bir kere set et (NX flag gibi davranır — zaten varsa dokunmaz)
    // Not: Upstash incr sırasında TTL setlenebilir ama iki aşamalı iş.
    // Performans için sadece periyodik (hash modulo) setle.
    const randomCheck = Math.random() < 0.01; // ~1% ihtimalle
    if (randomCheck) {
      await Promise.all([
        redis.expire(`pv:day:${today}`, 90 * 24 * 60 * 60),
        redis.expire(`pv:month:${month}`, 400 * 24 * 60 * 60),
      ]);
    }

    if (path) {
      // Sadece uzunluğu makul ve güvenli path'leri kaydet
      const cleanPath = path.slice(0, 120).replace(/[^\w\-/.]/g, "");
      if (cleanPath) {
        await redis.incr(`pv:path:${cleanPath}:${today}`);
      }
    }
  } catch {
    /* ignore */
  }
}

export type AnalyticsStats = {
  enabled: boolean;
  total: number;
  today: number;
  yesterday: number;
  last7Days: number;
  last30Days: number;
  thisMonth: number;
  daily: { date: string; count: number }[];
  topPaths: { path: string; count: number }[];
};

function shiftDate(d: Date, days: number): Date {
  const n = new Date(d);
  n.setUTCDate(n.getUTCDate() + days);
  return n;
}

/**
 * Admin panel için agregasyon. Redis yoksa null döner.
 */
export async function getAnalyticsStats(): Promise<AnalyticsStats | null> {
  if (!redis) return null;

  const today = new Date();
  const yesterday = shiftDate(today, -1);
  const month = ym(today);

  // Son 30 günün anahtarları
  const dayKeys: string[] = [];
  for (let i = 0; i < 30; i++) {
    dayKeys.push(`pv:day:${ymd(shiftDate(today, -i))}`);
  }

  try {
    const [total, thisMonthCount, ...dayCounts] = await Promise.all([
      redis.get<number>("pv:total"),
      redis.get<number>(`pv:month:${month}`),
      ...dayKeys.map((k) => redis!.get<number>(k)),
    ]);

    const daily = dayKeys.map((_, i) => ({
      date: ymd(shiftDate(today, -i)),
      count: Number(dayCounts[i] ?? 0),
    })).reverse();

    const last7Days = daily.slice(-7).reduce((s, d) => s + d.count, 0);
    const last30Days = daily.reduce((s, d) => s + d.count, 0);
    const todayCount = daily[daily.length - 1]?.count ?? 0;
    const yesterdayKey = ymd(yesterday);
    const yesterdayCount =
      daily.find((d) => d.date === yesterdayKey)?.count ?? 0;

    return {
      enabled: true,
      total: Number(total ?? 0),
      today: todayCount,
      yesterday: yesterdayCount,
      last7Days,
      last30Days,
      thisMonth: Number(thisMonthCount ?? 0),
      daily,
      topPaths: [], // top paths ayrı query olur, performans için şimdilik boş
    };
  } catch {
    return null;
  }
}
