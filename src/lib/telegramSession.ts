/**
 * Telegram bot için kullanıcı oturum (state) yönetimi.
 * Upstash Redis'te tutulur (Vercel serverless cold start'tan etkilenmez).
 * 1 saat TTL — kullanıcı işlemi yarım bırakırsa otomatik temizlenir.
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

const SESSION_TTL = 60 * 60; // 1 saat

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

export async function getSession(chatId: number): Promise<Session | null> {
  if (!redis) return null;
  try {
    const data = await redis.get<Session>(key(chatId));
    return data ?? null;
  } catch {
    return null;
  }
}

export async function setSession(
  chatId: number,
  session: Session,
): Promise<void> {
  if (!redis) return;
  try {
    await redis.set(key(chatId), session, { ex: SESSION_TTL });
  } catch {
    /* ignore */
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

export function newSession(): Session {
  return {
    type: null,
    step: "ASK_TYPE",
    data: {},
    startedAt: Date.now(),
  };
}

export const sessionStorageEnabled = redis !== null;
