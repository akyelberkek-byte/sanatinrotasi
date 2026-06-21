import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * Bot kurulum yardımcısı — bir kez çağrılır, Telegram'a webhook'u kaydeder.
 *
 * Kullanım:
 *   GET  /api/telegram/setup?action=info        → mevcut webhook durumunu görüntüle
 *   GET  /api/telegram/setup?action=set         → webhook'u Vercel URL'e bağla
 *   GET  /api/telegram/setup?action=delete      → webhook'u kaldır
 *
 * Hepsi CRON_SECRET ile korunur (manual çağrı: ?secret=...).
 */

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET;
const ADMIN_SECRET = process.env.CRON_SECRET; // mevcut admin secret'ı yeniden kullanıyoruz

export async function GET(req: NextRequest) {
  if (!ADMIN_SECRET) {
    return NextResponse.json(
      { error: "CRON_SECRET not configured" },
      { status: 503 },
    );
  }
  const provided = req.nextUrl.searchParams.get("secret");
  if (provided !== ADMIN_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!TOKEN) {
    return NextResponse.json(
      { error: "TELEGRAM_BOT_TOKEN not configured" },
      { status: 503 },
    );
  }

  const action = req.nextUrl.searchParams.get("action") || "info";
  const baseUrl = `https://api.telegram.org/bot${TOKEN}`;
  const webhookUrl = `${req.nextUrl.origin}/api/telegram/webhook`;

  try {
    if (action === "info") {
      const r = await fetch(`${baseUrl}/getWebhookInfo`);
      return NextResponse.json(await r.json());
    }
    if (action === "delete") {
      const r = await fetch(`${baseUrl}/deleteWebhook`);
      return NextResponse.json(await r.json());
    }
    if (action === "set") {
      const params = new URLSearchParams({
        url: webhookUrl,
        max_connections: "10",
        allowed_updates: JSON.stringify(["message", "edited_message"]),
        drop_pending_updates: "true",
      });
      if (WEBHOOK_SECRET) params.append("secret_token", WEBHOOK_SECRET);
      const r = await fetch(`${baseUrl}/setWebhook?${params}`);
      const data = await r.json();
      return NextResponse.json({
        ...data,
        webhookUrl,
        secretUsed: !!WEBHOOK_SECRET,
      });
    }

    return NextResponse.json({
      error: "Invalid action",
      validActions: ["info", "set", "delete"],
    });
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message },
      { status: 500 },
    );
  }
}
