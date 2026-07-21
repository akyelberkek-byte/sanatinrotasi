import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { writeClient } from "@/sanity/writeClient";
import { client } from "@/sanity/client";
import { groq } from "next-sanity";
import { captureError } from "@/lib/observability";

export const runtime = "nodejs";

/**
 * Bülten abonelikten çıkma endpoint'i.
 *
 * - GET  → maildeki linke tıklanınca; Türkçe onay sayfası döner
 * - POST → Gmail/Yahoo "one-click unsubscribe" (List-Unsubscribe-Post) için
 *
 * Token, e-posta adresinin CRON_SECRET ile HMAC'i. Yeni env var gerekmez.
 */

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function unsubscribeToken(email: string): string {
  const secret = process.env.CRON_SECRET || "";
  return createHmac("sha256", secret).update(email).digest("hex").slice(0, 32);
}

function tokenMatches(email: string, token: string): boolean {
  const expected = unsubscribeToken(email);
  if (expected.length !== token.length) return false;
  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(token));
  } catch {
    return false;
  }
}

const SUBSCRIBER_QUERY = groq`
  *[_type == "newsletterSubscriber" && email == $email][0]{ _id }
`;

type Outcome = "ok" | "invalid" | "notFound" | "error";

async function deactivate(request: NextRequest): Promise<Outcome> {
  const email = (request.nextUrl.searchParams.get("email") || "")
    .trim()
    .toLowerCase();
  const token = (request.nextUrl.searchParams.get("token") || "").trim();

  if (!email || !token || !process.env.CRON_SECRET) return "invalid";
  if (!tokenMatches(email, token)) return "invalid";

  try {
    const doc = await client.fetch<{ _id: string } | null>(
      SUBSCRIBER_QUERY,
      { email },
      { cache: "no-store" }
    );
    if (!doc?._id) return "notFound";
    await writeClient.patch(doc._id).set({ active: false }).commit();
    return "ok";
  } catch (e) {
    captureError(e, { route: "/api/newsletter/unsubscribe" });
    return "error";
  }
}

function page(title: string, body: string, status: number) {
  const html = `<!doctype html>
<html lang="tr">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="robots" content="noindex" />
    <title>${escapeHtml(title)} — Sanatın Rotası</title>
  </head>
  <body style="margin:0; background:#faf8f4; font-family: Georgia, serif; color:#1a1a18;">
    <div style="max-width:520px; margin:0 auto; padding:64px 24px; text-align:center;">
      <h1 style="font-size:26px; font-weight:700; margin:0 0 12px;">Sanatın Rotası</h1>
      <hr style="border:none; border-top:1px solid #ebe6db; margin:24px 0;" />
      <h2 style="font-size:20px; margin:0 0 12px;">${escapeHtml(title)}</h2>
      <p style="font-size:16px; line-height:1.6; color:#2d2b28;">${body}</p>
      <p style="margin-top:32px;">
        <a href="https://sanatinrotasi.com" style="color:#c45d3e; font-size:15px;">Siteye dön</a>
      </p>
    </div>
  </body>
</html>`;
  return new NextResponse(html, {
    status,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

export async function GET(request: NextRequest) {
  const outcome = await deactivate(request);

  switch (outcome) {
    case "ok":
      return page(
        "Bülten aboneliğiniz iptal edildi.",
        "Artık Sanatın Rotası bültenini almayacaksınız. Fikrinizi değiştirirseniz sitedeki bülten formundan tekrar abone olabilirsiniz.",
        200
      );
    case "notFound":
      return page(
        "Kayıt bulunamadı.",
        "Bu e-posta adresi bülten listemizde görünmüyor. Zaten abonelikten çıkmış olabilirsiniz.",
        404
      );
    case "invalid":
      return page(
        "Bağlantı geçersiz.",
        "Bu abonelikten çıkma bağlantısı geçersiz ya da eksik. Yardım için <a href=\"mailto:bilgi@sanatinrotasi.com\" style=\"color:#c45d3e;\">bilgi@sanatinrotasi.com</a> adresine yazabilirsiniz.",
        400
      );
    default:
      return page(
        "Bir sorun oluştu.",
        "İşleminizi şu anda tamamlayamadık. Lütfen biraz sonra tekrar deneyin.",
        500
      );
  }
}

// One-click unsubscribe (RFC 8058) — mail istemcisi POST atar, gövde beklenmez.
export async function POST(request: NextRequest) {
  const outcome = await deactivate(request);

  if (outcome === "ok" || outcome === "notFound") {
    return NextResponse.json({ success: true });
  }
  if (outcome === "invalid") {
    return NextResponse.json({ error: "Geçersiz bağlantı." }, { status: 400 });
  }
  return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
}
