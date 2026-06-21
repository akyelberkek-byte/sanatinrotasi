import { NextRequest, NextResponse } from "next/server";
import {
  sendTelegramMessage,
  sendChatAction,
  getTelegramFileUrl,
  downloadAsBuffer,
} from "@/lib/telegram";
import { publishArticle } from "@/lib/articlePublisher";
import { captureError } from "@/lib/observability";

export const runtime = "nodejs";

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const SECRET = process.env.TELEGRAM_WEBHOOK_SECRET;
const ALLOWED_IDS = (process.env.TELEGRAM_ALLOWED_USER_IDS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

// Hashtag → kategori slug eşlemesi
const HASHTAG_CATEGORY: Record<string, string> = {
  sergi: "sergiler",
  sergiler: "sergiler",
  roportaj: "roportajlar",
  röportaj: "roportajlar",
  yazi: "yazilar",
  yazı: "yazilar",
  etkinlik: "etkinlikler",
};

function helpText(): string {
  return `<b>🎨 Sanatın Rotası Bot</b>

<b>Haber yayımlamak için:</b>
📷 Görsel + caption gönder.
İlk satır = başlık
Kalan satırlar = içerik

<b>Kategori seçmek için hashtag:</b>
#sergiler  #roportaj  #yazi  #etkinlik

<b>Örnek:</b>
[📷 görsel ekle, sonra şunu yaz]
<i>Kanso Fotoğraf Sergisi Açıldı

Eskişehir'de minimal fotoğrafların buluştuğu sergi 15 Haziran'a kadar gezilebilir. Sergide 20 sanatçının eserleri yer alıyor.

#sergiler</i>

<b>Komutlar:</b>
/yardim — bu mesaj
/taslak — bir sonraki haberi taslak yap (publish değil)
/yayinla — bir sonraki haberi anında yayınla (default)

<i>Bot, Sanatın Rotası ekibine özeldir.</i>`;
}

// Bir sonraki haberin draft mı publish mi olacağını chat bazında tut.
// (Memory'de, instance restart'ta sıfırlanır — kullanıcı her mesajda kasıtlı seçmeli.)
const draftMode = new Map<number, boolean>();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleUpdate(update: any): Promise<void> {
  const msg = update.message || update.edited_message;
  if (!msg) return;

  const chatId: number | undefined = msg.chat?.id;
  const fromId = String(msg.from?.id || "");
  if (!chatId) return;
  if (!TOKEN) return;

  // Yetkilendirme — sadece izinli kullanıcılar
  if (!ALLOWED_IDS.includes(fromId)) {
    await sendTelegramMessage(
      TOKEN,
      chatId,
      `Bu bot Sanatın Rotası ekibine özeldir.\nSenin Telegram ID: <code>${fromId}</code>\n\nYetkilendirme için Berke'ye ulaş.`,
    );
    return;
  }

  const rawText: string = msg.text || msg.caption || "";
  const text = rawText.trim();

  // Komutlar
  if (
    text.startsWith("/start") ||
    text.startsWith("/yardim") ||
    text === "/help"
  ) {
    await sendTelegramMessage(TOKEN, chatId, helpText());
    return;
  }
  if (text.startsWith("/taslak")) {
    draftMode.set(chatId, true);
    await sendTelegramMessage(
      TOKEN,
      chatId,
      "✏️ Sonraki haberin <b>taslak</b> olarak kaydedilecek (Sanity'de gözükür ama sitede yayınlanmaz). Hemen yayımlamak için /yayinla yaz.",
    );
    return;
  }
  if (text.startsWith("/yayinla")) {
    draftMode.set(chatId, false);
    await sendTelegramMessage(
      TOKEN,
      chatId,
      "🚀 Sonraki haberin <b>doğrudan yayımlanacak</b>.",
    );
    return;
  }

  // Görsel + caption → makale oluştur
  if (Array.isArray(msg.photo) && msg.photo.length > 0) {
    if (!text) {
      await sendTelegramMessage(
        TOKEN,
        chatId,
        "❌ Lütfen görsele <b>caption</b> ekle.\nİlk satır başlık, kalan içerik olur.\n\nÖrnek caption:\n<i>Sergi Başlığı\n\nİlk paragraf...\n\nİkinci paragraf...\n\n#sergiler</i>",
      );
      return;
    }

    await sendChatAction(TOKEN, chatId, "upload_photo");
    await sendTelegramMessage(TOKEN, chatId, "⏳ Haber hazırlanıyor...");

    try {
      // En yüksek çözünürlük (Telegram dizi sondan en büyük)
      const photo = msg.photo[msg.photo.length - 1];
      const url = await getTelegramFileUrl(TOKEN, photo.file_id);
      if (!url) {
        await sendTelegramMessage(
          TOKEN,
          chatId,
          "❌ Görsel indirilemedi. Tekrar dener misin?",
        );
        return;
      }
      const buffer = await downloadAsBuffer(url);
      if (!buffer) {
        await sendTelegramMessage(TOKEN, chatId, "❌ Görsel indirilemedi.");
        return;
      }

      // Caption'ı parse et
      const lines = text.split("\n").map((l) => l.trim());
      const titleLine = lines.find((l) => l && !l.startsWith("#")) || "Başlıksız Haber";
      const remaining = lines
        .filter((l) => l !== titleLine)
        .join("\n")
        .trim();

      // Hashtag tespiti
      const hashtags = (text.match(/#([a-zçğıöşü]+)/gi) || []).map((h) =>
        h.slice(1).toLowerCase(),
      );
      let categorySlug: string | undefined;
      for (const h of hashtags) {
        if (HASHTAG_CATEGORY[h]) {
          categorySlug = HASHTAG_CATEGORY[h];
          break;
        }
        // Direkt slug eşleşmesi de denesin
        if (!categorySlug) categorySlug = h;
      }

      // Body: hashtag'leri temizle, başlığı çıkar
      const cleanBody = remaining
        .replace(/#[a-zçğıöşü]+/gi, "")
        .replace(/\n{3,}/g, "\n\n")
        .trim();

      const publishNow = !draftMode.get(chatId);

      const result = await publishArticle({
        title: titleLine,
        bodyText: cleanBody || titleLine,
        imageBuffer: buffer,
        imageType: "image/jpeg",
        imageFilename: `tg-${Date.now()}.jpg`,
        categorySlug,
        publishNow,
        source: "telegram",
      });

      // draftMode'u sıfırla (her mesaj kasıtlı seçim)
      draftMode.delete(chatId);

      const status = result.isDraft
        ? "📝 <b>Taslak kaydedildi</b> (Studio'dan publish etmen lazım)"
        : "✅ <b>Haber yayımlandı!</b>";

      await sendTelegramMessage(
        TOKEN,
        chatId,
        `${status}\n\n<b>${result.title}</b>\n\n${
          result.isDraft ? "" : `🔗 ${result.url}\n`
        }📝 Studio: ${result.studioUrl}\n\nKategori: ${categorySlug || "(yok)"}`,
        { disablePreview: false },
      );
    } catch (e) {
      captureError(e, { route: "telegram-webhook", phase: "publish" });
      await sendTelegramMessage(
        TOKEN,
        chatId,
        `❌ Haber oluşturulurken hata: ${(e as Error).message?.slice(0, 200) || "bilinmeyen"}`,
      );
    }
    return;
  }

  // Sadece metin geldi
  if (text && !text.startsWith("/")) {
    await sendTelegramMessage(
      TOKEN,
      chatId,
      "📷 Haber için <b>görsel</b> de eklemen gerekiyor.\n\nGörsel + caption gönder, caption'da ilk satır başlık olur.\n\n/yardim komutu örnek gösterir.",
    );
    return;
  }
}

export async function POST(req: NextRequest) {
  // Token tanımlı değilse 503
  if (!TOKEN) {
    return NextResponse.json(
      { ok: false, error: "TELEGRAM_BOT_TOKEN missing" },
      { status: 503 },
    );
  }

  // Secret token doğrulama — sadece Telegram'dan gelen istekleri kabul et
  if (SECRET) {
    const incoming = req.headers.get("x-telegram-bot-api-secret-token");
    if (incoming !== SECRET) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }
  }

  // Update'i parse et ve işle
  try {
    const update = await req.json();
    // Telegram için cevabı blokla bekletme — async işle, 200 hemen dön
    handleUpdate(update).catch((e) =>
      captureError(e, { route: "telegram-webhook", phase: "background" }),
    );
  } catch (e) {
    captureError(e, { route: "telegram-webhook", phase: "parse" });
  }

  // Telegram her durumda 200 bekler (yoksa retry yapar)
  return NextResponse.json({ ok: true });
}

// Tarayıcıdan açılırsa kısa bilgi göster
export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "Sanatın Rotası Telegram Bot Webhook",
    method: "POST only",
    tokenConfigured: !!TOKEN,
    secretConfigured: !!SECRET,
    allowedUsers: ALLOWED_IDS.length,
  });
}
