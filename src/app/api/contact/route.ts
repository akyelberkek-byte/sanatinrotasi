import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, subject, message } = body as {
      name: unknown;
      email: unknown;
      subject: unknown;
      message: unknown;
    };

    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof subject !== "string" ||
      typeof message !== "string"
    ) {
      return NextResponse.json({ error: "Geçersiz veri" }, { status: 400 });
    }

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedSubject = subject.trim();
    const trimmedMessage = message.trim();

    if (!trimmedName || !trimmedEmail || !trimmedSubject || !trimmedMessage) {
      return NextResponse.json(
        { error: "Tüm alanlar zorunludur" },
        { status: 400 },
      );
    }

    if (!EMAIL_REGEX.test(trimmedEmail)) {
      return NextResponse.json(
        { error: "Geçersiz e-posta adresi" },
        { status: 400 },
      );
    }

    if (trimmedName.length > 200 || trimmedSubject.length > 500 || trimmedMessage.length > 5000) {
      return NextResponse.json(
        { error: "Alan uzunluğu sınırı aşıldı" },
        { status: 400 },
      );
    }

    await resend.emails.send({
      from: "Sanatın Rotası İletişim <iletisim@sanatinrotasi.com>",
      to: "akyelberke@gmail.com",
      subject: `İletişim Formu: ${trimmedSubject}`,
      replyTo: trimmedEmail,
      html: `
        <div style="font-family: Georgia, serif; max-width: 500px; padding: 20px; color: #1a1a18;">
          <h2 style="font-size: 20px;">Yeni İletişim Mesajı</h2>
          <p><strong>Ad:</strong> ${escapeHtml(trimmedName)}</p>
          <p><strong>E-posta:</strong> ${escapeHtml(trimmedEmail)}</p>
          <p><strong>Konu:</strong> ${escapeHtml(trimmedSubject)}</p>
          <hr style="border: none; border-top: 1px solid #ebe6db;" />
          <p style="white-space: pre-wrap;">${escapeHtml(trimmedMessage)}</p>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Contact form error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
