"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/**
 * Her sayfa değişiminde /api/track endpoint'ine beacon gönderir.
 * Upstash Redis'e tek increment yazar. Redis kurulu değilse no-op.
 *
 * Bot filtresi ve rate limit API tarafında.
 * Admin/yonetim/studio sayfaları trackten çıkarılır (stats'ı bozmasın).
 */

const SKIP_PREFIXES = ["/yonetim", "/studio", "/api", "/giris", "/kayit"];

export default function PageViewTracker() {
  const pathname = usePathname();
  const lastTrackedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname) return;
    if (SKIP_PREFIXES.some((p) => pathname.startsWith(p))) return;
    // Aynı path için tekrar track etme (back/forward navigation)
    if (lastTrackedRef.current === pathname) return;
    lastTrackedRef.current = pathname;

    // Keepalive: sayfa kapatılsa bile request gitsin
    try {
      fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: pathname }),
        keepalive: true,
      }).catch(() => {
        /* silently ignore */
      });
    } catch {
      /* ignore */
    }
  }, [pathname]);

  return null;
}
