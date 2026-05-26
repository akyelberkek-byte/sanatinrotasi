import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { newsletterLimiter, getClientIp } from "@/lib/rateLimit";
import { captureError } from "@/lib/observability";
import { writeClient } from "@/sanity/writeClient";
import { client } from "@/sanity/client";
import { groq } from "next-sanity";
import { createHash } from "crypto";

// Email'den deterministic Sanity document ID üret.
// Sanity'de aynı _id ile create denemesi atomic biçimde unique olur
// → eventual consistency window'unda race condition'a karşı korur.
function emailToDocId(email: string): string {
  const hash = createHash("sha256").update(email).digest("hex").slice(0, 24);
  return `newsletterSubscriber.${hash}`;
}

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

const EXISTING_SUBSCRIBER_QUERY = groq`
  *[_type == "newsletterSubscriber" && email == $email][0] {
    _id,
    active
  }
`;

export async function POST(request: NextRequest) {
  try {
    // Rate limit: 5 istek / 10 dk
    const ip = getClientIp(request);
    const limit = await newsletterLimiter.check(`newsletter:${ip}`);
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

    // Lower-case normalization → "Foo@Gmail.com" ile "foo@gmail.com" aynı abone
    const normalizedEmail = email.trim().toLowerCase();

    if (normalizedEmail.length > 254) {
      return NextResponse.json({ error: "Geçersiz e-posta" }, { status: 400 });
    }

    // Deterministic doc ID — aynı email aynı ID üretir
    const docId = emailToDocId(normalizedEmail);

    // 1) Atomic createIfNotExists — Sanity unique constraint sağlar.
    //    Sanity'ye gönderdiğimiz ID zaten varsa Sanity hiçbir şey yapmaz,
    //    eski document döner. createIfNotExists eventual consistency'ye karşı
    //    güvenlidir (Sanity tarafında atomic).
    let isNewSubscriber = false;
    let existingDoc: { _id: string; active?: boolean } | null = null;
    try {
      const result = await writeClient.createIfNotExists({
        _id: docId,
        _type: "newsletterSubscriber",
        email: normalizedEmail,
        subscribedAt: new Date().toISOString(),
        active: true,
        source: "site",
      });
      // createIfNotExists eğer YENI yarattıysa subscribedAt yeni timestamp,
      // ZATEN VARSA eski subscribedAt döner. Birkaç saniye farkla "yeni" sayarız.
      const createdAt = result?.subscribedAt as string | undefined;
      if (createdAt) {
        const ageMs = Date.now() - new Date(createdAt).getTime();
        isNewSubscriber = ageMs < 5000; // 5sn içinde yaratılmış → yeni
      } else {
        isNewSubscriber = true;
      }
      existingDoc = {
        _id: result._id,
        active: (result as { active?: boolean }).active,
      };
    } catch (e) {
      // Sanity yazma hatası — fallback olarak EXISTING_SUBSCRIBER_QUERY ile oku
      captureError(e, { route: "/api/newsletter", phase: "createIfNotExists" });
      try {
        existingDoc = await client.fetch(
          EXISTING_SUBSCRIBER_QUERY,
          { email: normalizedEmail },
          { cache: "no-store" }
        );
      } catch {
        /* ignore */
      }
    }

    if (!isNewSubscriber) {
      // Tekrar tıklayan kullanıcıya başarılı dön ama mail GÖNDERMİYORUZ.
      // Deaktif idiyse tekrar aktif et.
      if (existingDoc && existingDoc.active === false) {
        try {
          await writeClient
            .patch(existingDoc._id)
            .set({ active: true })
            .commit();
        } catch (e) {
          captureError(e, { route: "/api/newsletter", phase: "reactivate" });
        }
      }
      return NextResponse.json({
        success: true,
        alreadySubscribed: true,
      });
    }

    // 3) Hoşgeldin maili + admin bildirimi (paralel)
    await Promise.all([
      resend.emails.send({
        from: "Sanatın Rotası <noreply@sanatinrotasi.com>",
        to: normalizedEmail,
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
      }),
      resend.emails.send({
        from: "Sanatın Rotası <noreply@sanatinrotasi.com>",
        to: ["ssanatinrotasii@gmail.com", "akyelberke@gmail.com"],
        subject: `Yeni bülten abonesi: ${normalizedEmail}`,
        html: `
          <div style="font-family: Georgia, serif; max-width: 500px; padding: 20px; color: #1a1a18;">
            <h2 style="font-size: 18px; margin-bottom: 12px;">🎨 Yeni Bülten Abonesi</h2>
            <p style="font-size: 15px;">Sanatın Rotası bültenine yeni bir kayıt geldi:</p>
            <p style="font-size: 16px; padding: 12px 16px; background: #ebe6db; border-left: 3px solid #c45d3e;">
              <strong>${escapeHtml(normalizedEmail)}</strong>
            </p>
            <p style="font-size: 13px; color: #6b6b6b;">
              Tüm aboneleri Sanity Studio → Bülten Abonesi sekmesinden görebilirsin.
            </p>
            <p style="font-size: 12px; color: #b8b0a2; margin-top: 20px;">
              Bu mesaj otomatik olarak Sanatın Rotası tarafından gönderildi.
            </p>
          </div>
        `,
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    captureError(error, { route: "/api/newsletter" });
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
