import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { ADMIN_EMAILS } from "@/lib/admin";
import { captureError } from "@/lib/observability";

export const runtime = "nodejs";

/**
 * Sanity write token sağlık kontrolü.
 *
 * Çalışma şekli:
 * - Vercel Cron her gün sabah (8:00 UTC) bu endpoint'e POST atar
 * - Sanity API /users/me endpoint'i tokenı doğrular (write mutation YAPMAZ — kirletmez)
 * - 200 dönerse token sağlıklı, sessizce success kaydeder
 * - 401/403 dönerse → Resend ile akyelberke@gmail.com + ssanatinrotasii@gmail.com'a alarm maili
 * - Network/timeout hatalarında alarm vermez (geçici sorun olabilir)
 *
 * Güvenlik:
 * - Vercel Cron otomatik CRON_SECRET header'ı ekler
 * - Manuel test için ?secret=... query parametresi ile de çağrılabilir
 *
 * Manuel test:
 *   curl https://sanatinrotasi.com/api/health/sanity-write?secret=<CRON_SECRET>
 */

const PROJECT_ID =
  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "5tddprs8";

function isAuthorized(request: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    // Secret yapılandırılmamış: localhost/dev için herkese izin ver
    // Production'da CRON_SECRET MUTLAKA ayarlı olmalı (cron header otomatik gelir)
    return process.env.NODE_ENV !== "production";
  }

  // Vercel Cron Authorization: Bearer <secret>
  const authHeader = request.headers.get("authorization");
  if (authHeader === `Bearer ${cronSecret}`) return true;

  // Manuel test için query param
  const querySecret = request.nextUrl.searchParams.get("secret");
  if (querySecret === cronSecret) return true;

  return false;
}

async function sendAlertEmail(reason: string, details: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    captureError(new Error("RESEND_API_KEY not set, cannot send health alert"));
    return;
  }
  const resend = new Resend(apiKey);
  const subject = "🚨 Sanity yazma tokeni bozuk — Sanatın Rotası";
  const html = `
<!doctype html>
<html><body style="font-family: -apple-system, system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1a1a1a;">
  <h2 style="color: #c0392b;">⚠️ Sanity Write Token Hatası</h2>
  <p>Otomatik sağlık kontrolü Sanity yazma tokeninin <strong>çalışmadığını</strong> tespit etti.</p>

  <h3>Etkilenen işlemler:</h3>
  <ul>
    <li>Yorum gönderme / silme / onaylama</li>
    <li>Bazı Sanity Studio yazma işlemleri</li>
  </ul>

  <h3>Hata detayı:</h3>
  <pre style="background:#f5f5f5; padding:12px; border-radius:4px; overflow-x:auto;">${reason}\n\n${details}</pre>

  <h3>Çözüm adımları:</h3>
  <ol>
    <li><a href="https://www.sanity.io/manage/personal/project/${PROJECT_ID}/api/tokens">Sanity → API → Tokens</a> sayfasına git</li>
    <li>"Add API token" → "Editor" yetkisiyle yeni token oluştur</li>
    <li>Tokeni kopyala</li>
    <li><a href="https://vercel.com/akyelberke-9029s-projects/sanatinrotasi-site/settings/environment-variables">Vercel → Settings → Environment Variables</a>'e gir</li>
    <li><code>SANITY_API_WRITE_TOKEN</code>'ı sil → tekrar ekle (yeni token ile)</li>
    <li>Vercel → Deployments → en son deploy → "Redeploy"</li>
  </ol>

  <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666;">
    Bu otomatik mesaj Sanatın Rotası health-check sisteminden gelmiştir.<br/>
    Tarih: ${new Date().toLocaleString("tr-TR", { timeZone: "Europe/Istanbul" })}
  </p>
</body></html>
`.trim();

  try {
    await resend.emails.send({
      from: "Sanatın Rotası <iletisim@sanatinrotasi.com>",
      to: ADMIN_EMAILS,
      subject,
      html,
    });
  } catch (e) {
    captureError(e, { where: "health-alert email send" });
  }
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = process.env.SANITY_API_WRITE_TOKEN;
  if (!token) {
    await sendAlertEmail(
      "SANITY_API_WRITE_TOKEN environment variable tanımlı değil",
      "Vercel env var'ı eksik. Sanity yazma kesinlikle çalışmaz.",
    );
    return NextResponse.json(
      { ok: false, reason: "no_token" },
      { status: 500 },
    );
  }

  // Sanity tokenını doğrula — write mutation yapmadan, sadece /users/me
  let status = 0;
  let body = "";
  try {
    const res = await fetch(
      `https://${PROJECT_ID}.api.sanity.io/v2025-01-01/users/me`,
      {
        headers: { Authorization: `Bearer ${token}` },
        // Cache disabled — gerçek durumu görelim
        cache: "no-store",
      },
    );
    status = res.status;
    body = (await res.text()).slice(0, 300);
  } catch (e) {
    // Network hatası → alarm verme (geçici olabilir); 503 dön
    captureError(e, { where: "health-check fetch" });
    return NextResponse.json(
      { ok: false, reason: "network", error: String(e) },
      { status: 503 },
    );
  }

  if (status === 200) {
    return NextResponse.json({
      ok: true,
      checkedAt: new Date().toISOString(),
    });
  }

  // 401/403 → token bozuk → alarm
  await sendAlertEmail(
    `Sanity API ${status} döndü`,
    `Endpoint: /users/me\nResponse: ${body}`,
  );

  return NextResponse.json(
    {
      ok: false,
      reason: "token_invalid",
      status,
      body,
    },
    { status: 500 },
  );
}
