import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

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

    // Yöneticiye bildirim
    await resend.emails.send({
      from: "Sanatın Rotası <noreply@sanatinrotasi.com>",
      to: "akyelberke@gmail.com",
      subject: `Yeni bülten abonesi: ${trimmedEmail}`,
      html: `<p>Yeni bülten abonesi: <strong>${escapeHtml(trimmedEmail)}</strong></p>`,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Newsletter error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
