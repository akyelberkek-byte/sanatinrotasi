/**
 * Lightweight observability helper.
 * - SENTRY_DSN yoksa no-op çalışır (dev ortamında veya Sentry kurulmamışken)
 * - Varsa @sentry/nextjs dinamik import edilir ve capture edilir
 *
 * Bu sayede kod değişmeden prod'da Sentry entegrasyonu açılıp kapatılabilir.
 * Sentry paketi opsiyonel — kurulu değilse de build kırılmaz.
 */

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;
const isEnabled = !!SENTRY_DSN;

type SentryLike = {
  captureException?: (err: unknown, hint?: unknown) => void;
  captureMessage?: (msg: string, level?: string) => void;
};

let sentryModule: SentryLike | null = null;
let sentryTried = false;

async function getSentry(): Promise<SentryLike | null> {
  if (!isEnabled) return null;
  if (sentryTried) return sentryModule;
  sentryTried = true;
  try {
    // @ts-expect-error — paket opsiyonel
    sentryModule = await import("@sentry/nextjs").catch(() => null);
    return sentryModule;
  } catch {
    return null;
  }
}

/**
 * Hata yakalayıcı. Sentry varsa oraya gönderir, yoksa console.error.
 * Her durumda async-void — çağıran kodu bloklamaz.
 */
export function captureError(err: unknown, context?: Record<string, unknown>) {
  // Local'de her zaman logla
  console.error("[observability]", err, context);
  if (!isEnabled) return;
  getSentry()
    .then((s) => {
      if (s?.captureException) s.captureException(err, { extra: context });
    })
    .catch(() => {
      /* ignore */
    });
}

export function captureMessage(msg: string, level: "info" | "warning" | "error" = "info") {
  if (!isEnabled) return;
  getSentry()
    .then((s) => {
      if (s?.captureMessage) s.captureMessage(msg, level);
    })
    .catch(() => {
      /* ignore */
    });
}
