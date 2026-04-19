import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { newsletterLimiter, getClientIp } from "@/lib/rateLimit";

const resend = new Resend(process.env.RESEND_API_KEY);

export const runtime = "nodejs";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export async function POST(request: NextRequest) {
  try {
    // Rate limit: 5 istek / 10 dk
    const ip = getClientIp(request);
    const limit = newsletterLimiter.check(`newsletter:${ip}`);
    if (!limit.success) {
      return NextResponse.json(
        { error: "Çok fazla istek. Biraz sonra tekrar deneyin." },
        {
          status: 429,
          headers: { "Retry-After": String(Math.ceil(limit.resetMs / 1000)) },
        }
      );
    }

    const body = await request.json();
    const { email } = body as { email: unknown };

    if (typeof email !== "string" || !EMAIL_REGEX.test(email.trim())) {
      return NextResponse.json({ error: "Geçersiz e-posta" }, { status: 400 });
    }

    const trimmedEmail = email.trim();

    if (trimmedEmail.length > 254) {
      return NextResponse.json({ error: "Geçersiz e-posta" }, { status: 400 });
    }

    // Hoşgeldin e-postası gönder
    await resend.emails.send({
      from: "Sanatın Rotası <noreply@sanatinrotasi.com>",
      to: trimmedEmail,
      subject: "Rotaya Hoş Geldiniz!",
      html: `
        <div style="font-family: Georgia, serif; max-width: 500px; margin: 0 auto; padding: 40px 20px; color: #1a1a18;">
          <h1 style="font-size: 28px; font-weight: 700; margin-bottom: 16px;">Sanatın Rotası</h1>
          <p style="font-size: 16px; line-height: 1.6; color: #2d2b28;">
            Merhaba,<br><br>
            Sanatın Rotası bültenine kayıt olduğunuz için teşekkür ederiz!
            Yeni yazılar, etkinlikler ve sanat rotaları hakkında ilk siz haberdar olacaksınız.
          </p>
          <p style="font-size: 14px; color: #b8b0a2; margin-top: 30px;">
            Sadece sanat. Asla spam değil.
          </p>
          <hr style="border: none; border-top: 1px solid #ebe6db; margin: 20px 0;" />
          <p style="font-size: 12px; color: #b8b0a2;">
            © 2026 Sanatın Rotası — Tüm hakları saklıdır.
          </p>
        </div>
      `,
    });

    // Yöneticilere bildirim
    await resend.emails.send({
      from: "Sanatın Rotası <noreply@sanatinrotasi.com>",
      to: ["ssanatinrotasii@gmail.com", "akyelberke@gmail.com"],
      subject: `Yeni bülten abonesi: ${trimmedEmail}`,
      html: `
        <div style="font-family: Georgia, serif; max-width: 500px; padding: 20px; color: #1a1a18;">
          <h2 style="font-size: 18px; margin-bottom: 12px;">🎨 Yeni Bülten Abonesi</h2>
          <p style="font-size: 15px;">Sanatın Rotası bültenine yeni bir kayıt geldi:</p>
          <p style="font-size: 16px; padding: 12px 16px; background: #ebe6db; border-left: 3px solid #c45d3e;">
            <strong>${escapeHtml(trimmedEmail)}</strong>
          </p>
          <p style="font-size: 12px; color: #b8b0a2; margin-top: 20px;">
            Bu mesaj otomatik olarak Sanatın Rotası tarafından gönderildi.
          </p>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Newsletter error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
