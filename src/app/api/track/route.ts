import { NextRequest, NextResponse } from "next/server";
import { trackPageView } from "@/lib/analytics";
import { createRateLimiter, getClientIp } from "@/lib/rateLimit";

export const runtime = "nodejs";

// Rate limit: tek IP dakikada en fazla 60 sayfa görüntüleme → bot spam'i önler
const trackLimiter = createRateLimiter(
  { interval: 60_000, tokensPerInterval: 60, uniqueTokenPerInterval: 2000 },
  "track"
);

// Bot user-agent kabaca tespit (tam değil ama çoğu botu eler)
const BOT_UA_RE =
  /bot|crawl|slurp|spider|facebookexternalhit|whatsapp|twitterbot|linkedinbot|embedly|discordbot|telegrambot|lighthouse|gtmetrix|pagespeed|headless/i;

export async function POST(request: NextRequest) {
  try {
    const ua = request.headers.get("user-agent") || "";
    if (BOT_UA_RE.test(ua)) {
      return NextResponse.json({ skipped: "bot" });
    }

    const ip = getClientIp(request);
    const rl = await trackLimiter.check(`track:${ip}`);
    if (!rl.success) {
      return NextResponse.json({ skipped: "rate_limit" });
    }

    const body = await request.json().catch(() => ({}));
    const path = typeof body?.path === "string" ? body.path : undefined;
    await trackPageView(path);

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false });
  }
}
