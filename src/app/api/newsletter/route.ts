import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { newsletterLimiter, getClientIp } from "@/lib/rateLimit";
import { captureError } from "@/lib/observability";
import { writeClient } from "@/sanity/writeClient";
import { client } from "@/sanity/client";
import { groq } from "next-sanity";
import { SITE_URL } from "@/lib/constants";
import { createHash, createHmac } from "crypto";

// Email'den deterministic Sanity document ID üret.
// Sanity'de aynı _id ile create denemesi atomic biçimde unique olur
// → eventual consistency window'unda race condition'a karşı korur.
// NOT: ID'de dot (.) kullanılamaz (Sanity "drafts.X" prefix'i için ayrılmış).
function emailToDocId(email: string): string {
  const hash = createHash("sha256").update(email).digest("hex").slice(0, 32);
  return `subscriber-${hash}`;
}

// Resend'i lazy oluştur — RESEND_API_KEY yoksa constructor throw ediyor ve
// `next build` "Collecting page data" aşamasında patlıyordu (CI/preview build'leri).
function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  return key ? new Resend(key) : null;
}

/**
 * Abonelikten çıkma linki için imzalı token.
 * (Aynı hesaplama /api/newsletter/unsubscribe içinde de var.)
 */
function unsubscribeToken(email: string): string {
  const secret = process.env.CRON_SECRET || "";
  return createHmac("sha256", secret).update(email).digest("hex").slice(0, 32);
}

function unsubscribeUrl(email: string): string {
  const params = new URLSearchParams({
    email,
    token: unsubscribeToken(email),
  });
  return `${SITE_URL}/api/newsletter/unsubscribe?${params.toString()}`;
}

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
    const requestStartMs = Date.now();
    try {
      const result = await writeClient.createIfNotExists({
        _id: docId,
        _type: "newsletterSubscriber",
        email: normalizedEmail,
        subscribedAt: new Date().toISOString(),
        active: true,
        source: "site",
      });
      // Sanity'nin atadığı _createdAt — yeni doc için tam ŞIMDI, eski doc için
      // orijinal kayıt zamanı. Bu request başlangıcı ile kıyaslarsak yeni/eski
      // tespit ederiz. Tight 2 saniye window — sadece bizim atomic create'imiz
      // sırasında "yeni" sayılır.
      const sanityCreatedAt = (result as { _createdAt?: string })._createdAt;
      if (sanityCreatedAt) {
        const docCreatedMs = new Date(sanityCreatedAt).getTime();
        // Sanity'nin doc create timestamp'i request'imizden ÖNCE veya sırasında
        // olabilir (network gecikmesi). Tolerans: 2sn.
        isNewSubscriber = docCreatedMs >= requestStartMs - 2000;
      } else {
        // _createdAt yoksa — yeni doc varsayalım
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

    // Ne yeni kayıt oluştu ne de mevcut kaydı okuyabildik → kayıt YOK.
    // Eskiden burada "zaten abonesiniz" denip success dönülüyordu: sessiz veri kaybı.
    if (existingDoc === null && !isNewSubscriber) {
      return NextResponse.json(
        { error: "Kayıt yapılamadı, lütfen tekrar deneyin." },
        { status: 500 }
      );
    }

    if (!isNewSubscriber) {
      // Tekrar tıklayan kullanıcıya başarılı dön ama mail GÖNDERMİYORUZ.
      // Daha önce abonelikten çıkmışsa (active: false) tekrar aktif et.
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

    // 3) Hoşgeldin maili + admin bildirimi (paralel, best effort).
    //    Abone kaydı zaten yapıldı; mail hatası isteği 500'e düşürmemeli.
    const resend = getResend();
    if (!resend) {
      captureError(
        new Error("RESEND_API_KEY tanımlı değil — bülten mailleri gönderilemedi"),
        { route: "/api/newsletter" }
      );
      return NextResponse.json({ success: true });
    }

    const unsubUrl = unsubscribeUrl(normalizedEmail);
    const listUnsubscribeHeaders = {
      "List-Unsubscribe": `<${unsubUrl}>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    };

    const results = await Promise.allSettled([
      resend.emails.send({
        headers: listUnsubscribeHeaders,
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
              Bülteni artık almak istemiyorsanız
              <a href="${escapeHtml(unsubUrl)}" style="color: #b8b0a2;">buradan abonelikten çıkabilirsiniz</a>.
            </p>
            <p style="font-size: 12px; color: #b8b0a2;">
              © 2026 Sanatın Rotası — Tüm hakları saklıdır.
            </p>
          </div>
        `,
      }),
      resend.emails.send({
        headers: listUnsubscribeHeaders,
        replyTo: normalizedEmail,
        from: "Sanatın Rotası <noreply@sanatinrotasi.com>",
        to: [
          "ssanatinrotasii@gmail.com",
          "akyelberke@gmail.com",
          "bilgi@sanatinrotasi.com",
        ],
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

    // Gönderilemeyen mailleri logla — kullanıcıya yine 200 dön (kayıt yapıldı).
    const phases = ["welcomeEmail", "adminNotification"] as const;
    results.forEach((r, i) => {
      if (r.status === "rejected") {
        captureError(r.reason, { route: "/api/newsletter", phase: phases[i] });
      } else if (r.value?.error) {
        // Resend throw etmez, hatayı response içinde döner
        captureError(r.value.error, {
          route: "/api/newsletter",
          phase: phases[i],
        });
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    captureError(error, { route: "/api/newsletter" });
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
