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
  pushExtraImage,
  getExtraImages,
  clearExtraImages,
  markUpdateSeen,
  sessionStorageEnabled,
  Session,
  ContentType,
} from "@/lib/telegramSession";
import { turkishSlugify } from "@/sanity/lib/slugify";
import { captureError } from "@/lib/observability";

export const runtime = "nodejs";
export const maxDuration = 60;

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const SECRET = process.env.TELEGRAM_WEBHOOK_SECRET;
const ALLOWED_IDS = (process.env.TELEGRAM_ALLOWED_USER_IDS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

/** Telegram Bot API dosya indirme sınırı ile uyumlu üst sınır */
const MAX_FILE_BYTES = 20 * 1024 * 1024; // 20 MB

/* ============================================================
   HELPER'lar
   ============================================================ */

async function tell(chatId: number, text: string, keyboard?: InlineButton[][]) {
  if (!TOKEN) return;
  await sendTelegramMessage(TOKEN, chatId, text, {
    inlineKeyboard: keyboard,
  });
}

/** Oturumu ve ona bağlı görsel listesini birlikte temizler. */
async function clearAll(chatId: number): Promise<void> {
  await clearSession(chatId);
  await clearExtraImages(chatId);
}

/**
 * Oturumu kaydeder. Başarısızsa kullanıcıyı uyarır ve false döner —
 * çağıran taraf bir sonraki adıma GEÇMEMELİ.
 */
async function saveSession(chatId: number, session: Session): Promise<boolean> {
  const ok = await setSession(chatId, session);
  if (!ok) {
    captureError(new Error("Telegram session kaydedilemedi"), {
      route: "telegram-session-save",
      chatId,
      step: session.step,
    });
    await tell(
      chatId,
      "⚠️ Oturum kaydedilemedi, lütfen mesajını tekrar gönder.",
    );
  }
  return ok;
}

/**
 * Ek görsel sayısı — önce Redis listesi, o boşsa session içindeki fallback.
 */
async function countExtras(chatId: number, session: Session): Promise<number> {
  const list = await getExtraImages(chatId);
  if (list.length > 0) return list.length;
  return session.data.extraImageAssetIds?.length || 0;
}

/** Ek görsellerin nihai listesi (yayımlarken kullanılır). */
async function resolveExtras(
  chatId: number,
  session: Session,
): Promise<string[]> {
  const list = await getExtraImages(chatId);
  if (list.length > 0) return list;
  return session.data.extraImageAssetIds || [];
}

/** Temiz bir oturum başlat (önceki her şeyi siler). */
async function startNewSession(chatId: number): Promise<void> {
  await clearExtraImages(chatId);
  const s = newSession();
  if (!(await saveSession(chatId, s))) return;
  await askStep(chatId, s);
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

function statusText(session: Session, extrasCount: number): string {
  const d = session.data;
  const typeName = session.type === "rota" ? "Sanat Rotası" : session.type === "yazi" ? "Yazı" : "Tip seçilmedi";
  const filled: string[] = [];
  if (d.title) filled.push("Başlık");
  if (d.slug) filled.push("Slug");
  if (d.subtitle) filled.push("Alt başlık");
  if (d.city) filled.push(`Şehir (${escapeHtml(d.city)})`);
  if (d.authorName) filled.push(`Yazar (${escapeHtml(d.authorName)})`);
  if (d.categoryTitle) filled.push(`Kategori (${escapeHtml(d.categoryTitle)})`);
  if (d.mainImageAssetId) {
    filled.push(
      extrasCount > 0 ? `Ana görsel ✓ (+${extrasCount} galeri)` : "Ana görsel ✓",
    );
  }
  if (d.altText) filled.push("Alt metin");
  if (d.description) filled.push(`Açıklama (${d.description.length} karakter)`);
  if (d.excerpt) filled.push("Özet");
  if (d.content) filled.push(`İçerik (${d.content.length} karakter)`);
  if (d.tags?.length) filled.push(`Etiketler (${d.tags.length})`);
  if (d.metaTitle) filled.push("Meta başlık");
  if (d.metaDescription) filled.push("Meta açıklama");
  if (d.ogImageAssetId) filled.push("OG görsel ✓");
  return `<b>📊 Mevcut Oturum</b>\n\n<b>Tip:</b> ${typeName}\n<b>Şu anki adım:</b> <code>${escapeHtml(session.step)}</code>\n${sessionAgeText(session)}\n\n<b>Dolu alanlar:</b>\n${filled.length ? filled.map((f) => `• ${f}`).join("\n") : "(henüz boş)"}\n\nİptal için /iptal`;
}

/** "⏱️ Bu oturum X önce başladı" satırı */
function sessionAgeText(session: Session): string {
  const ms = Date.now() - (session.startedAt || Date.now());
  const minutes = Math.floor(ms / 60000);
  if (minutes < 1) return "⏱️ Bu oturum az önce başladı.";
  if (minutes < 60) return `⏱️ Bu oturum ${minutes} dakika önce başladı.`;
  const hours = Math.floor(minutes / 60);
  return `⏱️ Bu oturum ${hours} saat önce başladı.`;
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
 * Gelen görselin boyutu limitin üstünde mi? (indirmeden önce kontrol)
 * Telegram photo/document nesnesi file_size veriyor; yoksa kontrol atlanır.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isTooLarge(msg: any): boolean {
  if (msg.document?.file_size && msg.document.file_size > MAX_FILE_BYTES)
    return true;
  if (Array.isArray(msg.photo) && msg.photo.length > 0) {
    const largest = msg.photo[msg.photo.length - 1];
    if (largest?.file_size && largest.file_size > MAX_FILE_BYTES) return true;
  }
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
  extrasCount = 0,
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
        `🔗 URL şöyle olacak:\n<code>${escapeHtml(d.slug || "")}</code>\n\nOnayla veya yeniden gir.`,
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
        await clearAll(chatId);
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
        await clearAll(chatId);
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
      await tell(
        chatId,
        "📷 <b>Ana görsel</b>i gönder.\n\n<i>İstersen birden fazla görsel gönderebilirsin — ilki ana görsel olur, kalan görseller yazının sonuna galeri olarak eklenir.</i>\n\nBittiğinde /devam yaz.",
      );
      return;

    case "ASK_DESCRIPTION":
      await tell(
        chatId,
        "📝 <b>Açıklama</b> metnini gönder. (paragrafları boş satırla ayır)\n\n<i>Uzunsa birden fazla mesaj hâlinde gönderebilirsin. Bitince /devam yaz.</i>",
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
        "📄 <b>İçerik / Body</b> — yazını gönder. (paragrafları boş satırla ayır)\n\n<i>Uzunsa birden fazla mesaj hâlinde gönderebilirsin. Bitince /devam yaz.</i>",
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
      const preview = formatPreview(session, extrasCount);
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

function formatPreview(session: Session, extrasCount = 0): string {
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
  if (d.mainImageAssetId) {
    s += `<b>Ana görsel:</b> ✓${extrasCount > 0 ? ` (+${extrasCount} galeri görseli)` : ""}\n`;
  }
  if (d.altText) s += `<b>Alt metin:</b> ${escapeHtml(d.altText.slice(0, 50))}\n`;
  if (session.type === "rota" && d.description)
    s += `<b>Açıklama:</b> ${escapeHtml(d.description.slice(0, 80))}…\n`;
  if (d.excerpt) s += `<b>Özet:</b> ${escapeHtml(d.excerpt.slice(0, 80))}…\n`;
  if (d.content)
    s += `<b>İçerik:</b> ${d.content.length} karakter\n`;
  if (d.tags && d.tags.length > 0)
    s += `<b>Etiketler:</b> ${escapeHtml(d.tags.join(", "))}\n`;
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
    await clearAll(chatId);
    await tell(chatId, helpText());
    return;
  }
  if (text === "/iptal" || text === "/cancel") {
    await clearAll(chatId);
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
    const extras = await countExtras(chatId, s);
    await tell(chatId, statusText(s, extras));
    return;
  }
  if (text === "/yeni" || text === "/new") {
    if (!sessionStorageEnabled) {
      await tell(
        chatId,
        "⚠️ Bot şu an kullanılamıyor (depolama bağlantısı yok). Berke'ye haber ver.",
      );
      return;
    }
    // Yarım kalmış bir oturum varsa onay iste — kazara silinmesin
    const existing = await getSession(chatId);
    if (existing) {
      await tell(
        chatId,
        `⚠️ <b>Devam eden bir iş var.</b>\n\n${sessionAgeText(existing)}\nAdım: <code>${escapeHtml(existing.step)}</code>${existing.data.title ? `\nBaşlık: ${escapeHtml(existing.data.title)}` : ""}\n\nSilinip yeniden başlansın mı?`,
        [
          [
            { text: "🗑️ Evet, sıfırla", callback_data: "new:yes" },
            { text: "↩️ Hayır, devam et", callback_data: "new:no" },
          ],
        ],
      );
      return;
    }
    await startNewSession(chatId);
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
      if (!(await saveSession(chatId, session))) return;
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
      if (!(await saveSession(chatId, session))) return;
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
      // /devam ile sonraki adıma geç (en az 1 görsel olmalı)
      if (text === "/devam" || text === "/tamam") {
        if (!d.mainImageAssetId) {
          await tell(
            chatId,
            "❌ En az 1 ana görsel gerekli. Önce bir fotoğraf gönder.",
          );
          return;
        }
        const total = 1 + (await countExtras(chatId, session));
        await tell(
          chatId,
          `✓ Toplam <b>${total}</b> görsel kaydedildi. Sonraki adıma geçiyorum.`,
        );
        await advance(chatId, session);
        return;
      }

      if (!hasImage(msg)) {
        await tell(
          chatId,
          "📷 Görsel gönder veya bitmek için /devam yaz.",
        );
        return;
      }

      if (isTooLarge(msg)) {
        await tell(
          chatId,
          "❌ Görsel çok büyük (max 20 MB). Daha küçük bir dosya gönder.",
        );
        return;
      }

      await sendChatAction(TOKEN!, chatId, "upload_photo");
      const asset = await uploadPhotoFromMessage(msg);
      if (!asset) {
        await tell(chatId, "❌ Görsel yüklenemedi, tekrar dene.");
        return;
      }

      if (!d.mainImageAssetId) {
        // İlk görsel — ana görsel olur
        d.mainImageAssetId = asset._id;
        d.mainImageUrl = asset.url;
        if (!(await saveSession(chatId, session))) return;
        await tell(
          chatId,
          "✓ Ana görsel kaydedildi.\n\n<i>Başka görsel eklemek için yeni fotoğraf gönder, bitirmek için /devam yaz.</i>",
        );
        return;
      }

      // İkinci ve sonraki görseller — galeri.
      // Redis list'e atomik RPUSH: Ela 5 fotoğrafı aynı anda gönderdiğinde
      // paralel çalışan istekler birbirinin üzerine yazmasın.
      const pushed = await pushExtraImage(chatId, asset._id);
      let count: number;
      if (pushed >= 0) {
        count = pushed;
      } else {
        // Redis yok → eski session fallback'i
        if (!d.extraImageAssetIds) d.extraImageAssetIds = [];
        d.extraImageAssetIds.push(asset._id);
        if (!(await saveSession(chatId, session))) return;
        count = d.extraImageAssetIds.length;
      }
      await tell(
        chatId,
        `✓ ${count + 1}. görsel eklendi. Toplam <b>${count + 1}</b>.\n\n<i>Devam et veya /devam ile sonraki adıma geç.</i>`,
      );
      return;
    }

    case "ASK_DESCRIPTION": {
      // Uzun metin Telegram'ın 4096 karakter sınırında bölünebiliyor —
      // gelen her mesajı birikime ekle, /devam gelene kadar bekle.
      if (text === "/devam" || text === "/tamam") {
        if (!d.description || d.description.length < 10) {
          await tell(
            chatId,
            "📝 Açıklama en az 10 karakter olmalı. Önce metni gönder.",
          );
          return;
        }
        await advance(chatId, session);
        return;
      }
      if (!text) {
        await tell(
          chatId,
          "📝 Açıklama metnini gönder. Bitince /devam yaz.",
        );
        return;
      }
      d.description = d.description ? `${d.description}\n\n${text}` : text;
      if (!(await saveSession(chatId, session))) return;
      await tell(
        chatId,
        `✓ Eklendi (toplam ${d.description.length} karakter). Devam et veya /devam yaz.`,
      );
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
      // Uzun yazı birden çok mesaja bölünebilir — birikimli topla.
      if (text === "/devam" || text === "/tamam") {
        if (!d.content || d.content.length < 20) {
          await tell(
            chatId,
            "📄 İçerik en az 20 karakter olmalı. Önce yazıyı gönder.",
          );
          return;
        }
        await advance(chatId, session);
        return;
      }
      if (!text) {
        await tell(
          chatId,
          "📄 Yazını metin olarak gönder. Bitince /devam yaz.",
        );
        return;
      }
      d.content = d.content ? `${d.content}\n\n${text}` : text;
      if (!(await saveSession(chatId, session))) return;
      await tell(
        chatId,
        `✓ Eklendi (toplam ${d.content.length} karakter). Devam et veya /devam yaz.`,
      );
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
        if (isTooLarge(msg)) {
          await tell(
            chatId,
            "❌ Görsel çok büyük (max 20 MB). Daha küçük bir dosya gönder.",
          );
          return;
        }
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

    case "ASK_TYPE":
    case "ASK_AUTHOR":
    case "ASK_CATEGORY":
      // Bu adımlar buton bekliyor — metin gelirse sessiz kalma, butonları tekrar göster
      await tell(chatId, "👆 Lütfen yukarıdaki butonlardan birini seç.");
      await askStep(chatId, session);
      return;

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
    await clearAll(chatId);
    return;
  }
  session.step = next as Session["step"];
  if (!(await saveSession(chatId, session))) return;
  const extras =
    session.step === "CONFIRM_PUBLISH" ? await countExtras(chatId, session) : 0;
  await askStep(chatId, session, extras);
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

  // /yeni onayı — oturum yoksa da çalışmalı, bu yüzden session kontrolünden önce
  if (data === "new:yes") {
    await clearAll(chatId);
    await startNewSession(chatId);
    return;
  }
  if (data === "new:no") {
    await tell(
      chatId,
      "↩️ Tamam, mevcut işe devam ediyoruz. Durum için /durum yaz.",
    );
    return;
  }

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
      await clearAll(chatId);
      return;
    }
    if (t !== "rota" && t !== "yazi") return;
    session.type = t as ContentType;
    session.step = "ASK_TITLE";
    if (!(await saveSession(chatId, session))) return;
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
    await clearAll(chatId);
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

  // Sanity şemasında yazı için kategori zorunlu ama writeClient doğrulamıyor —
  // eksikse yayımlamadan önce kullanıcıyı kategori adımına geri gönder.
  if (session.type === "yazi" && !d.categoryRef) {
    await tell(
      chatId,
      "❌ Kategori seçilmemiş — yazı kategorisiz yayımlanamaz. Lütfen kategori seç.",
    );
    session.step = "ASK_CATEGORY";
    if (!(await saveSession(chatId, session))) return;
    await askStep(chatId, session);
    return;
  }

  const gallery = await resolveExtras(chatId, session);

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
        galleryImageAssetIds: gallery,
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
        galleryImageAssetIds: gallery,
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
    await clearAll(chatId);
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
  // Düzenlenen mesajlar akışı bozuyor (aynı içerik ikinci kez işleniyor) — yok say
  if (update.edited_message || update.edited_channel_post) return;

  // Idempotency: Telegram timeout sonrası aynı update'i tekrar gönderiyor.
  // Redis yoksa markUpdateSeen true döner, kontrol atlanır.
  if (typeof update.update_id === "number") {
    const fresh = await markUpdateSeen(update.update_id);
    if (!fresh) return;
  }

  // Callback query (button tıklama)
  if (update.callback_query) {
    const cb = update.callback_query;
    const fromId = String(cb.from?.id || "");
    if (!ALLOWED_IDS.includes(fromId)) {
      // Spinner takılı kalmasın — yetkisiz de olsa query'yi cevapla
      if (TOKEN && cb.id) await answerCallbackQuery(TOKEN, cb.id);
      return;
    }
    await handleCallbackQuery(cb);
    return;
  }

  // Message
  const msg = update.message;
  if (!msg) return;

  const chatId: number | undefined = msg.chat?.id;
  const fromId = String(msg.from?.id || "");
  if (!chatId || !TOKEN) return;

  // Yetkisiz kullanıcıya hiçbir bilgi verme — sessizce yok say
  if (!ALLOWED_IDS.includes(fromId)) return;

  await handleMessage(chatId, msg);
}

export async function POST(req: NextRequest) {
  if (!TOKEN) {
    return NextResponse.json(
      { ok: false, error: "TELEGRAM_BOT_TOKEN missing" },
      { status: 503 },
    );
  }
  // Secret ZORUNLU — tanımsızsa endpoint kapalı (fail-closed).
  if (!SECRET) {
    return NextResponse.json(
      { ok: false, error: "TELEGRAM_WEBHOOK_SECRET missing" },
      { status: 503 },
    );
  }
  const incoming = req.headers.get("x-telegram-bot-api-secret-token");
  if (incoming !== SECRET) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  try {
    const update = await req.json();
    // ÖNEMLİ: serverless function response döndüğünde runtime kapanır.
    // Eskiden handleUpdate(...).catch fire-and-forget'tı → sendMessage
    // tamamlanmadan function ölüyordu, mesaj kullanıcıya ulaşmıyordu.
    // Şimdi await — Telegram 60sn timeout veriyor, bizim işimiz <2sn.
    await handleUpdate(update).catch((e) =>
      captureError(e, { route: "telegram-webhook" }),
    );
  } catch (e) {
    captureError(e, { route: "telegram-webhook", phase: "parse" });
  }
  return NextResponse.json({ ok: true });
}

/**
 * Health check. Yapılandırma detayları (secret/token/kullanıcı sayısı)
 * sadece CRON_SECRET ile sorgulanabilir — herkese açık sızdırma yok.
 */
export async function GET(req: NextRequest) {
  const adminSecret = process.env.CRON_SECRET;
  const provided = req.nextUrl.searchParams.get("secret");
  if (adminSecret && provided === adminSecret) {
    return NextResponse.json({
      ok: true,
      service: "Sanatın Rotası Telegram Bot",
      tokenConfigured: !!TOKEN,
      secretConfigured: !!SECRET,
      allowedUsers: ALLOWED_IDS.length,
      sessionStorageEnabled,
    });
  }
  return NextResponse.json({ ok: true });
}
