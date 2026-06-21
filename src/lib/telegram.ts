/**
 * Telegram Bot API helper'ları.
 * Webhook endpoint'inden çağrılır.
 */

const API = (token: string) => `https://api.telegram.org/bot${token}`;

export async function sendTelegramMessage(
  token: string,
  chatId: number,
  text: string,
  opts: { parseMode?: "HTML" | "MarkdownV2"; disablePreview?: boolean } = {},
): Promise<void> {
  try {
    await fetch(`${API(token)}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: opts.parseMode || "HTML",
        disable_web_page_preview: opts.disablePreview ?? false,
      }),
    });
  } catch {
    /* swallow — webhook'u kırma */
  }
}

export async function sendChatAction(
  token: string,
  chatId: number,
  action: "typing" | "upload_photo" = "typing",
): Promise<void> {
  try {
    await fetch(`${API(token)}/sendChatAction`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, action }),
    });
  } catch {
    /* ignore */
  }
}

/**
 * Telegram file_id → indirilebilir URL.
 * Telegram dosyaları 1 saatlik geçerli URL'ler veriyor; hemen kullanılmalı.
 */
export async function getTelegramFileUrl(
  token: string,
  fileId: string,
): Promise<string | null> {
  try {
    const res = await fetch(`${API(token)}/getFile?file_id=${fileId}`);
    const data = await res.json();
    if (!data?.ok || !data.result?.file_path) return null;
    return `https://api.telegram.org/file/bot${token}/${data.result.file_path}`;
  } catch {
    return null;
  }
}

export async function downloadAsBuffer(url: string): Promise<Buffer | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const ab = await res.arrayBuffer();
    return Buffer.from(ab);
  } catch {
    return null;
  }
}
