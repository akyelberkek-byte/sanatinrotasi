import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { name, email, subject, message } = await request.json();

    if (!name || !email || !subject || !message) {
      return NextResponse.json({ error: "Tüm alanlar zorunludur" }, { status: 400 });
    }

    // TODO: Resend ile e-posta gönderimi aktifleştirilecek
    // const resend = new Resend(process.env.RESEND_API_KEY);
    // await resend.emails.send({
    //   from: "iletisim@sanatinrotasi.com",
    //   to: "ela@sanatinrotasi.com",
    //   subject: `İletişim Formu: ${subject}`,
    //   html: `<p><strong>${name}</strong> (${email})</p><p>${message}</p>`,
    // });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
