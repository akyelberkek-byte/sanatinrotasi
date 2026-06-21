import { NextRequest, NextResponse } from "next/server";
import {
  sendTelegramMessage,
  sendChatAction,
  getTelegramFileUrl,
  downloadAsBuffer,
  answerCallbackQuery,
  InlineButton,
} from "@/lib/telegram";
import {
  publishArticle,
  publishRoute,
  uploadImageAsset,
  listCategories,
  listAuthors,
} from "@/lib/articlePublisher";
import {
  getSession,
  setSession,
  clearSession,
  newSession,
  Session,
  SessionData,
  ContentType,
} from "@/lib/telegramSession";
import { turkishSlugify } from "@/sanity/lib/slugify";
import { captureError } from "@/lib/observability";

export const runtime = "nodejs";

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const SECRET = process.env.TELEGRAM_WEBHOOK_SECRET;
const ALLOWED_IDS = (process.env.TELEGRAM_ALLOWED_USER_IDS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

/* ============================================================
   HELPER'lar
   ============================================================ */

async function tell(chatId: number, text: string, keyboard?: InlineButton[][]) {
  if (!TOKEN) return;
  await sendTelegramMessage(TOKEN, chatId, text, {
    inlineKeyboard: keyboard,
  });
}

function helpText(): string {
  return `<b>🎨 Sanatın Rotası Bot</b>

<b>Yeni içerik yayımlamak için:</b>
/yeni — Adım adım rehber başlat (Sanat Rotası veya Yazı)

<b>Hızlı komutlar:</b>
/durum — Devam eden işlemin durumunu göster
/iptal — Devam eden işlemi iptal et
/yardim — Bu mesaj

<b>İpuçları:</b>
• Görseli sıkıştırılmış (photo) veya dosya olarak gönderebilirsin
• Opsiyonel adımlarda <i>geç</i> yaz, atla
• Slug'ı beğenmezsen <i>Yeniden</i> butonuna bas, yeni slug yaz

<i>Bot Sanatın Rotası ekibine özeldir.</i>`;
}

function statusText(session: Session): string {
  const d = session.data;
  const typeName = session.type === "rota" ? "Sanat Rotası" : session.type === "yazi" ? "Yazı" : "Tip seçilmedi";
  const filled: string[] = [];
  if (d.title) filled.push("Başlık");
  if (d.slug) filled.push("Slug");
  if (d.subtitle) filled.push("Alt başlık");
  if (d.city) filled.push(`Şehir (${d.city})`);
  if (d.authorName) filled.push(`Yazar (${d.authorName})`);
  if (d.categoryTitle) filled.push(`Kategori (${d.categoryTitle})`);
  if (d.mainImageAssetId) filled.push("Ana görsel ✓");
  if (d.altText) filled.push("Alt metin");
  if (d.description) filled.push("Açıklama");
  if (d.excerpt) filled.push("Özet");
  if (d.content) filled.push("İçerik");
  if (d.tags?.length) filled.push(`Etiketler (${d.tags.length})`);
  if (d.metaTitle) filled.push("Meta başlık");
  if (d.metaDescription) filled.push("Meta açıklama");
  if (d.ogImageAssetId) filled.push("OG görsel ✓");
  return `<b>📊 Mevcut Oturum</b>\n\n<b>Tip:</b> ${typeName}\n<b>Şu anki adım:</b> <code>${session.step}</code>\n\n<b>Dolu alanlar:</b>\n${filled.length ? filled.map((f) => `• ${f}`).join("\n") : "(henüz boş)"}\n\nİptal için /iptal`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Mesajda herhangi bir görsel içeriği var mı? (photo veya document image/*) */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function hasImage(msg: any): boolean {
  if (Array.isArray(msg.photo) && msg.photo.length > 0) return true;
  if (msg.document?.mime_type?.startsWith?.("image/")) return true;
  return false;
}

/**
 * Telegram'dan görseli (photo veya document) indir, Sanity'ye yükle.
 * - msg.photo: sıkıştırılmış, en yüksek çözünürlük
 * - msg.document: "Dosya olarak gönder" seçeneğiyle uncompressed image
 *   (Ela yüksek kalite için bunu tercih edebilir)
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function uploadPhotoFromMessage(msg: any): Promise<{ _id: string; url: string } | null> {
  if (!TOKEN) return null;
  let fileId: string | undefined;
  let mimeType = "image/jpeg";
  let filename = `tg-${Date.now()}.jpg`;

  if (Array.isArray(msg.photo) && msg.photo.length > 0) {
    fileId = msg.photo[msg.photo.length - 1].file_id;
  } else if (msg.document?.mime_type?.startsWith?.("image/")) {
    fileId = msg.document.file_id;
    mimeType = msg.document.mime_type;
    if (msg.document.file_name) filename = msg.document.file_name;
  }

  if (!fileId) return null;
  const url = await getTelegramFileUrl(TOKEN, fileId);
  if (!url) return null;
  const buffer = await downloadAsBuffer(url);
  if (!buffer) return null;
  return uploadImageAsset(buffer, mimeType, filename);
}

/* ============================================================
   AKIŞ TANIMI
   ============================================================ */

// Rota akışı: ASK_TITLE → CONFIRM_SLUG → ASK_SUBTITLE → ASK_CITY →
//             ASK_MAIN_IMAGE → ASK_DESCRIPTION → ASK_TAGS →
//             ASK_META_TITLE → ASK_META_DESCRIPTION → ASK_OG_IMAGE →
//             CONFIRM_PUBLISH

// Yazi akışı: ASK_TITLE → CONFIRM_SLUG → ASK_AUTHOR → ASK_CATEGORY →
//             ASK_MAIN_IMAGE → ASK_ALT_TEXT → ASK_EXCERPT → ASK_CONTENT →
//             ASK_TAGS → ASK_META_TITLE → ASK_META_DESCRIPTION →
//             ASK_OG_IMAGE → CONFIRM_PUBLISH

const SHARED_END_FLOW = [
  "ASK_TAGS",
  "ASK_META_TITLE",
  "ASK_META_DESCRIPTION",
  "ASK_OG_IMAGE",
  "CONFIRM_PUBLISH",
] as const;

const ROTA_FLOW = [
  "ASK_TITLE",
  "CONFIRM_SLUG",
  "ASK_SUBTITLE",
  "ASK_CITY",
  "ASK_MAIN_IMAGE",
  "ASK_DESCRIPTION",
  ...SHARED_END_FLOW,
] as const;

const YAZI_FLOW = [
  "ASK_TITLE",
  "CONFIRM_SLUG",
  "ASK_AUTHOR",
  "ASK_CATEGORY",
  "ASK_MAIN_IMAGE",
  "ASK_ALT_TEXT",
  "ASK_EXCERPT",
  "ASK_CONTENT",
  ...SHARED_END_FLOW,
] as const;

function nextStep(type: ContentType, current: string): string | null {
  const flow = type === "rota" ? ROTA_FLOW : YAZI_FLOW;
  const idx = flow.indexOf(current as never);
  if (idx === -1 || idx === flow.length - 1) return null;
  return flow[idx + 1];
}

/* ============================================================
   STEP PROMPT'LARI — Ela'ya soru sor
   ============================================================ */

async function askStep(
  chatId: number,
  session: Session,
): Promise<void> {
  const step = session.step;
  const d = session.data;
  const typeName =
    session.type === "rota"
      ? "Sanat Rotası"
      : session.type === "yazi"
        ? "Yazı"
        : "İçerik";

  switch (step) {
    case "ASK_TYPE":
      await tell(chatId, "🎨 Ne yayımlamak istiyorsun?", [
        [{ text: "🗺️ Sanat Rotası", callback_data: "type:rota" }],
        [{ text: "📰 Yazı", callback_data: "type:yazi" }],
        [{ text: "🎫 Etkinlik (yakında)", callback_data: "type:etkinlik" }],
      ]);
      return;

    case "ASK_TITLE":
      await tell(
        chatId,
        `📝 <b>${typeName} başlığı</b> ne olacak?\n\nÖrnek: <i>"Eskişehir'de Sanat Yürüyüşü"</i>`,
      );
      return;

    case "CONFIRM_SLUG":
      await tell(
        chatId,
        `🔗 URL şöyle olacak:\n<code>${d.slug}</code>\n\nOnayla veya yeniden gir.`,
        [
          [
            { text: "✓ Onayla", callback_data: "slug:ok" },
            { text: "✎ Yeniden", callback_data: "slug:redo" },
          ],
        ],
      );
      return;

    case "ASK_SUBTITLE":
      await tell(
        chatId,
        "📝 <b>Alt başlık</b> ne olacak? (kısa açıklayıcı cümle)\n\n<i>Atlamak istersen 'geç' yaz.</i>",
      );
      return;

    case "ASK_CITY":
      await tell(
        chatId,
        "🏙️ <b>Şehir</b>?\n\n<i>Eskişehir bırakmak için 'tamam' yaz, değiştirmek için yeni şehri yaz.</i>",
      );
      return;

    case "ASK_AUTHOR": {
      const authors = await listAuthors();
      if (authors.length === 0) {
        await tell(chatId, "❌ Sanity'de yazar yok. Önce Studio'dan ekle.");
        await clearSession(chatId);
        return;
      }
      await tell(
        chatId,
        "✍️ <b>Yazar</b> kim?",
        authors.map((a) => [
          { text: a.name, callback_data: `author:${a._id}` },
        ]),
      );
      return;
    }

    case "ASK_CATEGORY": {
      const cats = await listCategories();
      if (cats.length === 0) {
        await tell(chatId, "❌ Sanity'de kategori yok. Önce Studio'dan ekle.");
        await clearSession(chatId);
        return;
      }
      await tell(
        chatId,
        "📁 <b>Kategori</b>?",
        cats.map((c) => [
          { text: c.title, callback_data: `cat:${c.slug.slice(0, 50)}` },
        ]),
      );
      return;
    }

    case "ASK_MAIN_IMAGE":
      await tell(chatId, "📷 <b>Ana görsel</b>i gönder.");
      return;

    case "ASK_DESCRIPTION":
      await tell(
        chatId,
        "📝 <b>Açıklama</b> metni? (paragrafları boş satırla ayır)",
      );
      return;

    case "ASK_ALT_TEXT":
      await tell(
        chatId,
        "🔤 Ana görselin <b>alt metni</b>? (görsel görünmezse okunan açıklama, SEO için)",
      );
      return;

    case "ASK_EXCERPT":
      await tell(
        chatId,
        "✂️ <b>Özet</b>? (listede yazının altında görünen kısa açıklama, 150-180 karakter)",
      );
      return;

    case "ASK_CONTENT":
      await tell(
        chatId,
        "📄 <b>İçerik / Body</b>? (asıl yazı metni, paragrafları boş satırla ayır)",
      );
      return;

    case "ASK_TAGS":
      await tell(
        chatId,
        "🏷️ <b>Etiketler</b>? Virgülle ayır.\n\nÖrnek: <code>sergi, modern sanat, eskişehir</code>\n\n<i>Atlamak için 'geç'.</i>",
      );
      return;

    case "ASK_META_TITLE":
      await tell(
        chatId,
        "🔍 SEO <b>Meta Başlık</b>? (Google'da görünen başlık, 60 karakter)\n\n<i>Atlamak için 'geç' (ana başlık kullanılır).</i>",
      );
      return;

    case "ASK_META_DESCRIPTION":
      await tell(
        chatId,
        "🔍 SEO <b>Meta Açıklama</b>? (Google'da başlık altı, 150-160 karakter)\n\n<i>Atlamak için 'geç' (özet kullanılır).</i>",
      );
      return;

    case "ASK_OG_IMAGE":
      await tell(
        chatId,
        "📱 <b>Sosyal Medya Görseli</b>? (Twitter/WhatsApp paylaşımında görünen, 1200×630 ideal)\n\n<i>Atlamak için 'geç' (ana görsel kullanılır).</i>",
      );
      return;

    case "CONFIRM_PUBLISH": {
      const preview = formatPreview(session);
      await tell(chatId, preview, [
        [
          { text: "🚀 Yayımla", callback_data: "publish:yes" },
          { text: "❌ İptal", callback_data: "publish:no" },
        ],
      ]);
      return;
    }
  }
}

/* ============================================================
   Önizleme metni
   ============================================================ */

function formatPreview(session: Session): string {
  const d = session.data;
  const type =
    session.type === "rota" ? "Sanat Rotası" : "Yazı";
  let s = `<b>📋 Önizleme — ${type}</b>\n\n`;
  s += `<b>Başlık:</b> ${escapeHtml(d.title || "-")}\n`;
  s += `<b>URL:</b> ${escapeHtml(d.slug || "-")}\n`;
  if (session.type === "rota") {
    if (d.subtitle) s += `<b>Alt başlık:</b> ${escapeHtml(d.subtitle)}\n`;
    s += `<b>Şehir:</b> ${escapeHtml(d.city || "Eskişehir")}\n`;
  } else {
    if (d.authorName) s += `<b>Yazar:</b> ${escapeHtml(d.authorName)}\n`;
    if (d.categoryTitle)
      s += `<b>Kategori:</b> ${escapeHtml(d.categoryTitle)}\n`;
  }
  if (d.mainImageAssetId) s += `<b>Ana görsel:</b> ✓\n`;
  if (d.altText) s += `<b>Alt metin:</b> ${escapeHtml(d.altText.slice(0, 50))}\n`;
  if (session.type === "rota" && d.description)
    s += `<b>Açıklama:</b> ${escapeHtml(d.description.slice(0, 80))}…\n`;
  if (d.excerpt) s += `<b>Özet:</b> ${escapeHtml(d.excerpt.slice(0, 80))}…\n`;
  if (d.content)
    s += `<b>İçerik:</b> ${d.content.length} karakter\n`;
  if (d.tags && d.tags.length > 0)
    s += `<b>Etiketler:</b> ${d.tags.join(", ")}\n`;
  if (d.metaTitle) s += `<b>Meta başlık:</b> ${escapeHtml(d.metaTitle)}\n`;
  if (d.metaDescription)
    s += `<b>Meta açıklama:</b> ${escapeHtml(d.metaDescription.slice(0, 80))}…\n`;
  if (d.ogImageAssetId) s += `<b>OG görsel:</b> ✓\n`;
  s += `\nYayımlamak için onayla.`;
  return s;
}

/* ============================================================
   HANDLE — text / photo / callback
   ============================================================ */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleMessage(chatId: number, msg: any): Promise<void> {
  const rawText: string = msg.text || msg.caption || "";
  const text = rawText.trim();

  // Komutlar
  if (text === "/start" || text === "/yardim" || text === "/help") {
    await clearSession(chatId);
    await tell(chatId, helpText());
    return;
  }
  if (text === "/iptal" || text === "/cancel") {
    await clearSession(chatId);
    await tell(chatId, "❌ İşlem iptal edildi. Yeni başlamak için /yeni");
    return;
  }
  if (text === "/durum" || text === "/status") {
    const s = await getSession(chatId);
    if (!s) {
      await tell(
        chatId,
        "Aktif bir oturum yok. /yeni ile başlayabilirsin.",
      );
      return;
    }
    await tell(chatId, statusText(s));
    return;
  }
  if (text === "/yeni" || text === "/new") {
    const s = newSession();
    await setSession(chatId, s);
    await askStep(chatId, s);
    return;
  }

  // Aktif oturum?
  const session = await getSession(chatId);
  if (!session) {
    await tell(chatId, "Başlamak için /yeni yaz veya /yardim ile komutları gör.");
    return;
  }

  // Adım bazlı işle
  await processStep(chatId, session, msg, text);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function processStep(chatId: number, session: Session, msg: any, text: string): Promise<void> {
  const d = session.data;
  const step = session.step;

  switch (step) {
    case "ASK_TITLE": {
      if (!text || text.length < 3) {
        await tell(chatId, "Başlık çok kısa, en az 3 karakter olmalı.");
        return;
      }
      d.title = text.slice(0, 200);
      d.slug = turkishSlugify(d.title).slice(0, 96);
      session.step = "CONFIRM_SLUG";
      await setSession(chatId, session);
      await askStep(chatId, session);
      return;
    }

    case "CONFIRM_SLUG": {
      if (!text) {
        await tell(chatId, "🔗 Slug'ı metin olarak yaz (sadece a-z, 0-9, tire).");
        return;
      }
      const slugged = turkishSlugify(text).slice(0, 96);
      if (!slugged) {
        await tell(
          chatId,
          "❌ Geçerli slug üretilemedi. Sadece harf/rakam içeren bir metin gönder.",
        );
        return;
      }
      d.slug = slugged;
      session.step = "CONFIRM_SLUG";
      await setSession(chatId, session);
      await askStep(chatId, session);
      return;
    }

    case "ASK_SUBTITLE": {
      if (!text) {
        await tell(chatId, "📝 Alt başlığı metin olarak yaz veya 'geç' diye yanıtla.");
        return;
      }
      const lower = text.toLowerCase();
      if (lower !== "geç" && lower !== "atla") {
        d.subtitle = text.slice(0, 300);
      }
      await advance(chatId, session);
      return;
    }

    case "ASK_CITY": {
      if (!text) {
        await tell(chatId, "🏙️ Şehir adı yaz veya 'tamam' ile Eskişehir bırak.");
        return;
      }
      const lower = text.toLowerCase();
      if (lower === "tamam" || lower === "ok") {
        d.city = "Eskişehir";
      } else {
        d.city = text.slice(0, 80);
      }
      await advance(chatId, session);
      return;
    }

    case "ASK_MAIN_IMAGE": {
      if (!hasImage(msg)) {
        await tell(
          chatId,
          "📷 Lütfen bir görsel gönder (fotoğraf veya dosya olarak).",
        );
        return;
      }
      await sendChatAction(TOKEN!, chatId, "upload_photo");
      const asset = await uploadPhotoFromMessage(msg);
      if (!asset) {
        await tell(chatId, "❌ Görsel yüklenemedi, tekrar dene.");
        return;
      }
      d.mainImageAssetId = asset._id;
      d.mainImageUrl = asset.url;
      await tell(chatId, "✓ Ana görsel kaydedildi.");
      await advance(chatId, session);
      return;
    }

    case "ASK_DESCRIPTION": {
      if (!text || text.length < 10) {
        await tell(
          chatId,
          "📝 Açıklama en az 10 karakter olmalı. Metin gönder.",
        );
        return;
      }
      d.description = text;
      await advance(chatId, session);
      return;
    }

    case "ASK_ALT_TEXT": {
      if (!text) {
        await tell(chatId, "🔤 Alt metni yaz (görsel görünmediğinde gösterilen).");
        return;
      }
      d.altText = text.slice(0, 200);
      await advance(chatId, session);
      return;
    }

    case "ASK_EXCERPT": {
      if (!text) {
        await tell(chatId, "✂️ Özet metnini yaz.");
        return;
      }
      d.excerpt = text.slice(0, 200);
      await advance(chatId, session);
      return;
    }

    case "ASK_CONTENT": {
      if (!text || text.length < 20) {
        await tell(
          chatId,
          "📄 İçerik en az 20 karakter olmalı. Yazıyı metin olarak gönder.",
        );
        return;
      }
      d.content = text;
      await advance(chatId, session);
      return;
    }

    case "ASK_TAGS": {
      if (!text) {
        await tell(chatId, "🏷️ Etiketleri virgülle yaz veya 'geç' yanıtla.");
        return;
      }
      const lower = text.toLowerCase();
      if (lower !== "geç" && lower !== "atla") {
        d.tags = text
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
          .slice(0, 15);
      }
      await advance(chatId, session);
      return;
    }

    case "ASK_META_TITLE": {
      if (!text) {
        await tell(chatId, "🔍 Meta başlığı yaz veya 'geç' yanıtla.");
        return;
      }
      const lower = text.toLowerCase();
      if (lower !== "geç" && lower !== "atla") {
        d.metaTitle = text.slice(0, 60);
      }
      await advance(chatId, session);
      return;
    }

    case "ASK_META_DESCRIPTION": {
      if (!text) {
        await tell(chatId, "🔍 Meta açıklamayı yaz veya 'geç' yanıtla.");
        return;
      }
      const lower = text.toLowerCase();
      if (lower !== "geç" && lower !== "atla") {
        d.metaDescription = text.slice(0, 160);
      }
      await advance(chatId, session);
      return;
    }

    case "ASK_OG_IMAGE": {
      // Photo geldiyse, caption'daki "geç" göz ardı edilir — görsel önceliklidir
      if (hasImage(msg)) {
        await sendChatAction(TOKEN!, chatId, "upload_photo");
        const asset = await uploadPhotoFromMessage(msg);
        if (!asset) {
          await tell(chatId, "❌ Görsel yüklenemedi.");
          return;
        }
        d.ogImageAssetId = asset._id;
        d.ogImageUrl = asset.url;
        await tell(chatId, "✓ Sosyal medya görseli kaydedildi.");
        await advance(chatId, session);
        return;
      }
      // Görsel yoksa metin kontrolü
      const lower = text.toLowerCase();
      if (lower === "geç" || lower === "atla") {
        await advance(chatId, session);
        return;
      }
      await tell(
        chatId,
        "📷 Görsel gönder veya 'geç' yazarak atla (ana görsel kullanılır).",
      );
      return;
    }

    case "CONFIRM_PUBLISH":
      await tell(
        chatId,
        "Lütfen aşağıdaki <b>Yayımla</b> veya <b>İptal</b> butonuna tıkla.",
      );
      return;

    default:
      return;
  }
}

async function advance(chatId: number, session: Session): Promise<void> {
  const next = session.type ? nextStep(session.type, session.step) : null;
  if (!next) {
    await tell(chatId, "Bir hata oluştu. /yeni ile tekrar başla.");
    await clearSession(chatId);
    return;
  }
  session.step = next as Session["step"];
  await setSession(chatId, session);
  await askStep(chatId, session);
}

/* ============================================================
   CALLBACK QUERY — butona basıldı
   ============================================================ */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleCallbackQuery(cb: any): Promise<void> {
  const chatId: number = cb.message?.chat?.id;
  const data: string = cb.data || "";
  if (!chatId || !TOKEN) return;
  await answerCallbackQuery(TOKEN, cb.id);

  const session = await getSession(chatId);
  if (!session) {
    await tell(chatId, "Oturum bulunamadı. /yeni ile tekrar başla.");
    return;
  }

  // type:rota | type:yazi | type:etkinlik
  if (data.startsWith("type:")) {
    const t = data.slice(5);
    if (t === "etkinlik") {
      await tell(
        chatId,
        "🎫 Etkinlik akışı henüz hazır değil — şimdilik Sanity Studio'dan eklenmeli. <i>Bekle Berke ekleyecek.</i>",
      );
      await clearSession(chatId);
      return;
    }
    if (t !== "rota" && t !== "yazi") return;
    session.type = t as ContentType;
    session.step = "ASK_TITLE";
    await setSession(chatId, session);
    await askStep(chatId, session);
    return;
  }

  if (data === "slug:ok") {
    await advance(chatId, session);
    return;
  }
  if (data === "slug:redo") {
    await tell(chatId, "🔗 Yeni URL slug'ı yaz (sadece a-z, 0-9, tire):");
    // İstediği yeni slug'ı text olarak alacak, CONFIRM_SLUG'da kalıyoruz
    return;
  }

  if (data.startsWith("author:")) {
    const authorRef = data.slice(7);
    session.data.authorRef = authorRef;
    // Author name'i bul (UI için)
    const authors = await listAuthors();
    const author = authors.find((a) => a._id === authorRef);
    if (author) session.data.authorName = author.name;
    await advance(chatId, session);
    return;
  }

  if (data.startsWith("cat:")) {
    const catSlug = data.slice(4);
    const cats = await listCategories();
    const cat = cats.find((c) => c.slug === catSlug);
    if (!cat) {
      await tell(chatId, "Kategori bulunamadı. Tekrar dene.");
      return;
    }
    session.data.categoryRef = cat._id;
    session.data.categorySlug = cat.slug;
    session.data.categoryTitle = cat.title;
    await advance(chatId, session);
    return;
  }

  if (data === "publish:no") {
    await clearSession(chatId);
    await tell(chatId, "❌ İptal edildi. Yeni başlamak için /yeni");
    return;
  }
  if (data === "publish:yes") {
    await publishFromSession(chatId, session);
    return;
  }
}

async function publishFromSession(
  chatId: number,
  session: Session,
): Promise<void> {
  const d = session.data;
  await tell(chatId, "⏳ Yayımlanıyor...");
  try {
    if (session.type === "rota") {
      const result = await publishRoute({
        title: d.title!,
        slug: d.slug,
        subtitle: d.subtitle,
        city: d.city || "Eskişehir",
        descriptionText: d.description || d.title!,
        mainImageAssetId: d.mainImageAssetId,
        tags: d.tags,
        metaTitle: d.metaTitle,
        metaDescription: d.metaDescription,
        ogImageAssetId: d.ogImageAssetId,
        publishNow: true,
      });
      await tell(
        chatId,
        `✅ <b>Rota yayımlandı!</b>\n\n<b>${escapeHtml(d.title!)}</b>\n\n🔗 ${result.url}\n📝 ${result.studioUrl}`,
      );
    } else if (session.type === "yazi") {
      const result = await publishArticle({
        title: d.title!,
        slug: d.slug,
        bodyText: d.content || d.title!,
        authorRef: d.authorRef,
        categoryRef: d.categoryRef,
        mainImageAssetId: d.mainImageAssetId,
        altText: d.altText,
        excerpt: d.excerpt,
        tags: d.tags,
        metaTitle: d.metaTitle,
        metaDescription: d.metaDescription,
        ogImageAssetId: d.ogImageAssetId,
        publishNow: true,
      });
      await tell(
        chatId,
        `✅ <b>Yazı yayımlandı!</b>\n\n<b>${escapeHtml(d.title!)}</b>\n\n🔗 ${result.url}\n📝 ${result.studioUrl}`,
      );
    }
    await clearSession(chatId);
  } catch (e) {
    captureError(e, { route: "telegram-publish" });
    await tell(
      chatId,
      `❌ Yayımlama hatası: ${escapeHtml((e as Error).message?.slice(0, 200) || "bilinmeyen")}`,
    );
  }
}

/* ============================================================
   ANA WEBHOOK
   ============================================================ */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleUpdate(update: any): Promise<void> {
  // Callback query (button tıklama)
  if (update.callback_query) {
    const cb = update.callback_query;
    const fromId = String(cb.from?.id || "");
    if (!ALLOWED_IDS.includes(fromId)) return;
    await handleCallbackQuery(cb);
    return;
  }

  // Message
  const msg = update.message || update.edited_message;
  if (!msg) return;

  const chatId: number | undefined = msg.chat?.id;
  const fromId = String(msg.from?.id || "");
  if (!chatId || !TOKEN) return;

  if (!ALLOWED_IDS.includes(fromId)) {
    await tell(
      chatId,
      `Bu bot Sanatın Rotası ekibine özeldir.\nSenin Telegram ID: <code>${fromId}</code>\n\nYetkilendirme için Berke'ye ulaş.`,
    );
    return;
  }

  await handleMessage(chatId, msg);
}

export async function POST(req: NextRequest) {
  if (!TOKEN) {
    return NextResponse.json(
      { ok: false, error: "TELEGRAM_BOT_TOKEN missing" },
      { status: 503 },
    );
  }
  if (SECRET) {
    const incoming = req.headers.get("x-telegram-bot-api-secret-token");
    if (incoming !== SECRET) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }
  }
  try {
    const update = await req.json();
    handleUpdate(update).catch((e) =>
      captureError(e, { route: "telegram-webhook" }),
    );
  } catch (e) {
    captureError(e, { route: "telegram-webhook", phase: "parse" });
  }
  return NextResponse.json({ ok: true });
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "Sanatın Rotası Telegram Bot",
    tokenConfigured: !!TOKEN,
    secretConfigured: !!SECRET,
    allowedUsers: ALLOWED_IDS.length,
  });
}
