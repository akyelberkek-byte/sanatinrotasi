/**
 * Telegram bot için kullanıcı oturum (state) yönetimi.
 * Upstash Redis'te tutulur (Vercel serverless cold start'tan etkilenmez).
 * 24 saat TTL — kullanıcı işlemi yarım bırakırsa otomatik temizlenir.
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

const SESSION_TTL = 24 * 60 * 60; // 24 saat
/** İşlenmiş update_id'ler için TTL — Telegram retry penceresi kadar yeterli */
const UPDATE_TTL = 60 * 60; // 1 saat

export type ContentType = "rota" | "yazi" | "etkinlik";

export type SessionStep =
  | "ASK_TYPE"
  | "ASK_TITLE"
  | "CONFIRM_SLUG"
  | "ASK_SUBTITLE"
  | "ASK_CITY"
  | "ASK_AUTHOR"
  | "ASK_CATEGORY"
  | "ASK_MAIN_IMAGE"
  | "ASK_DESCRIPTION"
  | "ASK_ALT_TEXT"
  | "ASK_EXCERPT"
  | "ASK_CONTENT"
  | "ASK_TAGS"
  | "ASK_META_TITLE"
  | "ASK_META_DESCRIPTION"
  | "ASK_OG_IMAGE"
  | "CONFIRM_PUBLISH"
  | "DONE";

export interface SessionData {
  // Common
  title?: string;
  slug?: string;
  mainImageAssetId?: string;
  mainImageUrl?: string; // önizleme için
  /** Birden fazla görsel — ilki main, kalan body'nin sonunda galeri olarak görünür */
  extraImageAssetIds?: string[];
  tags?: string[];
  metaTitle?: string;
  metaDescription?: string;
  ogImageAssetId?: string;
  ogImageUrl?: string;
  // Rota-specific
  subtitle?: string;
  city?: string;
  description?: string; // route portable text içeriği (düz metin)
  // Yazi-specific
  authorRef?: string;
  authorName?: string;
  categoryRef?: string;
  categorySlug?: string;
  categoryTitle?: string;
  altText?: string;
  excerpt?: string;
  content?: string; // yazi body içeriği
}

export interface Session {
  type: ContentType | null;
  step: SessionStep;
  data: SessionData;
  startedAt: number;
}

function key(chatId: number): string {
  return `tg:session:${chatId}`;
}

/** Ek görseller ayrı bir Redis list'te tutulur — paralel update'lerde race olmasın */
function extraImagesKey(chatId: number): string {
  return `tg:images:${chatId}`;
}

export async function getSession(chatId: number): Promise<Session | null> {
  if (!redis) return null;
  try {
    const data = await redis.get<Session>(key(chatId));
    return data ?? null;
  } catch {
    return null;
  }
}

/** Oturumu kaydeder. Başarı durumunu döner — çağıran taraf kullanıcıyı uyarabilsin. */
export async function setSession(
  chatId: number,
  session: Session,
): Promise<boolean> {
  if (!redis) return false;
  try {
    await redis.set(key(chatId), session, { ex: SESSION_TTL });
    return true;
  } catch {
    return false;
  }
}

export async function clearSession(chatId: number): Promise<void> {
  if (!redis) return;
  try {
    await redis.del(key(chatId));
  } catch {
    /* ignore */
  }
}

/* ============================================================
   EK GÖRSELLER — atomik liste (RPUSH)
   ============================================================ */

/**
 * Ek görsel asset id'sini listeye ekler, listenin yeni uzunluğunu döner.
 * Redis yoksa -1 döner → çağıran taraf session fallback'ine düşer.
 */
export async function pushExtraImage(
  chatId: number,
  assetId: string,
): Promise<number> {
  if (!redis) return -1;
  try {
    const len = await redis.rpush(extraImagesKey(chatId), assetId);
    await redis.expire(extraImagesKey(chatId), SESSION_TTL);
    return len;
  } catch {
    return -1;
  }
}

export async function getExtraImages(chatId: number): Promise<string[]> {
  if (!redis) return [];
  try {
    const list = await redis.lrange<string>(extraImagesKey(chatId), 0, -1);
    return Array.isArray(list) ? list.filter(Boolean) : [];
  } catch {
    return [];
  }
}

export async function clearExtraImages(chatId: number): Promise<void> {
  if (!redis) return;
  try {
    await redis.del(extraImagesKey(chatId));
  } catch {
    /* ignore */
  }
}

/* ============================================================
   IDEMPOTENCY — aynı update_id iki kez işlenmesin
   ============================================================ */

/**
 * update_id'yi "işlendi" olarak işaretler.
 * true → ilk kez görülüyor, işlenebilir.
 * false → daha önce işlenmiş, atlanmalı.
 * Redis yoksa true döner (kontrol atlanır).
 */
export async function markUpdateSeen(updateId: number): Promise<boolean> {
  if (!redis) return true;
  try {
    const res = await redis.set(`tg:upd:${updateId}`, 1, {
      nx: true,
      ex: UPDATE_TTL,
    });
    return res !== null;
  } catch {
    // Redis hatasında akışı kesme
    return true;
  }
}

export function newSession(): Session {
  return {
    type: null,
    step: "ASK_TYPE",
    data: {},
    startedAt: Date.now(),
  };
}

export const sessionStorageEnabled = redis !== null;
