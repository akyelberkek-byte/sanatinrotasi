import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { writeClient } from "@/sanity/writeClient";
import { contactLimiter, getClientIp } from "@/lib/rateLimit";

const resend = new Resend(process.env.RESEND_API_KEY);

export const runtime = "nodejs";
export const maxDuration = 300; // 5 dakika — büyük dosyalar için

const MAX_TOTAL_BYTES = 4 * 1024 * 1024; // 4MB — Vercel Hobby serverless limit

function escapeHtml(input: string): string {
  return String(input ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

type UploadedAsset = {
  originalName: string;
  url: string;
  size: number;
  mimeType: string;
};

async function uploadToSanity(file: File): Promise<UploadedAsset> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const mime = file.type || "application/octet-stream";
  const assetType = mime.startsWith("video/") ? "file" : "image";

  const asset = await writeClient.assets.upload(
    assetType as "file" | "image",
    buffer,
    {
      filename: file.name,
      contentType: mime,
    }
  );

  return {
    originalName: file.name,
    url: asset.url,
    size: file.size,
    mimeType: mime,
  };
}

export async function POST(request: NextRequest) {
  try {
    // Rate limit: 5 istek / 10 dakika (IP bazlı)
    const ip = getClientIp(request);
    const limit = contactLimiter.check(`contact:${ip}`);
    if (!limit.success) {
      return NextResponse.json(
        {
          error: `Çok fazla istek. Lütfen ${Math.ceil(limit.resetMs / 60_000)} dakika sonra tekrar deneyin.`,
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.ceil(limit.resetMs / 1000)),
          },
        }
      );
    }

    const contentType = request.headers.get("content-type") || "";

    let name = "";
    let email = "";
    let subject = "";
    let message = "";
    let externalLink = "";
    let attachmentFiles: File[] = [];

    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      name = String(form.get("name") || "").trim();
      email = String(form.get("email") || "").trim();
      subject = String(form.get("subject") || "").trim();
      message = String(form.get("message") || "").trim();
      externalLink = String(form.get("externalLink") || "").trim();
      attachmentFiles = form
        .getAll("attachments")
        .filter((v): v is File => v instanceof File && v.size > 0);
    } else {
      // JSON fallback — eski entegrasyonlar veya başka formlar için
      const json = await request.json().catch(() => ({}));
      name = String(json.name || "").trim();
      email = String(json.email || "").trim();
      subject = String(json.subject || "").trim();
      message = String(json.message || "").trim();
      externalLink = String(json.externalLink || "").trim();
    }

    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: "Tüm alanları doldur." },
        { status: 400 }
      );
    }

    // Email validation (safe regex, no catastrophic backtracking)
    const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!EMAIL_REGEX.test(email) || email.length > 254) {
      return NextResponse.json(
        { error: "Geçerli bir e-posta adresi gir." },
        { status: 400 }
      );
    }

    // Length limits (frontend bypass-proof)
    if (name.length > 200 || subject.length > 500 || message.length > 5000) {
      return NextResponse.json(
        { error: "Alan uzunluğu sınırı aşıldı." },
        { status: 400 }
      );
    }

    // External link validation (only http/https)
    if (externalLink) {
      if (externalLink.length > 500) {
        return NextResponse.json(
          { error: "Link çok uzun." },
          { status: 400 }
        );
      }
      try {
        const url = new URL(externalLink);
        if (url.protocol !== "http:" && url.protocol !== "https:") {
          throw new Error("invalid protocol");
        }
      } catch {
        return NextResponse.json(
          { error: "Geçerli bir URL gir (https:// ile başlamalı)." },
          { status: 400 }
        );
      }
    }

    // Boyut kontrolü
    const totalBytes = attachmentFiles.reduce((sum, f) => sum + f.size, 0);
    if (totalBytes > MAX_TOTAL_BYTES) {
      return NextResponse.json(
        { error: "Dosyaların toplam boyutu 4 MB'ı aşıyor. Daha büyük dosyalar için mesaja WeTransfer/Drive linki ekleyin." },
        { status: 400 }
      );
    }

    // MIME type whitelist (server-side, bypass-proof)
    const ALLOWED_MIME_PREFIXES = ["image/", "video/", "audio/"];
    for (const file of attachmentFiles) {
      const mime = file.type || "";
      if (!ALLOWED_MIME_PREFIXES.some((p) => mime.startsWith(p))) {
        return NextResponse.json(
          { error: `Desteklenmeyen dosya türü: ${file.name}` },
          { status: 400 }
        );
      }
    }

    // Dosyaları Sanity'ye yükle (varsa)
    const uploaded: UploadedAsset[] = [];
    for (const file of attachmentFiles) {
      try {
        const asset = await uploadToSanity(file);
        uploaded.push(asset);
      } catch (err) {
        console.error("Attachment upload error:", err);
        // Yüklenemeyen dosyayı atla, maili yine de gönder
      }
    }

    // External link (WeTransfer / Drive / Vimeo)
    const externalLinkHtml = externalLink
      ? `
        <h3 style="font-size: 16px; margin-top: 24px;">Büyük Dosya Linki</h3>
        <p style="padding: 12px 16px; background: #ebe6db; border-left: 3px solid #c45d3e;">
          <a href="${escapeHtml(externalLink)}" target="_blank" style="color: #c45d3e; word-break: break-all;">${escapeHtml(externalLink)}</a>
        </p>`
      : "";

    // Email içeriği
    const attachmentsHtml =
      uploaded.length > 0
        ? `
        <h3 style="font-size: 16px; margin-top: 24px;">Eklenen Dosyalar (${
          uploaded.length
        })</h3>
        <ul style="padding-left: 20px;">
          ${uploaded
            .map(
              (a) =>
                `<li style="margin-bottom: 6px;">
                  <a href="${a.url}" target="_blank">${escapeHtml(
                    a.originalName
                  )}</a>
                  <span style="color: #b8b0a2; font-size: 12px;"> — ${Math.round(
                    a.size / 1024
                  )} KB · ${escapeHtml(a.mimeType)}</span>
                </li>`
            )
            .join("")}
        </ul>`
        : "";

    await resend.emails.send({
      from: "Sanatın Rotası İletişim <iletisim@sanatinrotasi.com>",
      to: ["akyelberke@gmail.com", "ssanatinrotasii@gmail.com"],
      subject: `İletişim Formu: ${subject}`,
      replyTo: email,
      html: `
        <div style="font-family: Georgia, serif; max-width: 640px; padding: 20px; color: #1a1a18;">
          <h2 style="font-size: 20px;">Yeni İletişim Mesajı</h2>
          <p><strong>Ad:</strong> ${escapeHtml(name)}</p>
          <p><strong>E-posta:</strong> ${escapeHtml(email)}</p>
          <p><strong>Konu:</strong> ${escapeHtml(subject)}</p>
          <hr style="border: none; border-top: 1px solid #ebe6db;" />
          <p style="white-space: pre-wrap;">${escapeHtml(message)}</p>
          ${externalLinkHtml}
          ${attachmentsHtml}
        </div>
      `,
    });

    return NextResponse.json({ success: true, uploaded: uploaded.length });
  } catch (error) {
    console.error("Contact form error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
