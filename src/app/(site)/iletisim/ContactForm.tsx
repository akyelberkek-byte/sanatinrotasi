"use client";

import { useRef, useState } from "react";

const MAX_TOTAL_BYTES = 80 * 1024 * 1024; // 80MB toplam
const ACCEPT = "image/*,video/*";

function humanSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function ContactForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [files, setFiles] = useState<File[]>([]);
  const [errorMsg, setErrorMsg] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const totalBytes = files.reduce((sum, f) => sum + f.size, 0);
  const overLimit = totalBytes > MAX_TOTAL_BYTES;

  function handleFilesChange(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files || []);
    // Merge with existing, but deduplicate by (name + size)
    const map = new Map<string, File>();
    for (const f of [...files, ...picked]) {
      map.set(`${f.name}-${f.size}`, f);
    }
    setFiles(Array.from(map.values()));
    // Reset input so selecting the same file again triggers change
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removeFile(key: string) {
    setFiles((prev) => prev.filter((f) => `${f.name}-${f.size}` !== key));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg("");

    if (overLimit) {
      setErrorMsg(
        `Dosyaların toplam boyutu ${humanSize(MAX_TOTAL_BYTES)} sınırını aşıyor.`
      );
      setStatus("error");
      return;
    }

    setStatus("loading");

    try {
      const body = new FormData();
      body.append("name", formData.name);
      body.append("email", formData.email);
      body.append("subject", formData.subject);
      body.append("message", formData.message);
      for (const file of files) {
        body.append("attachments", file, file.name);
      }

      const res = await fetch("/api/contact", {
        method: "POST",
        body,
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        setStatus("success");
        setFormData({ name: "", email: "", subject: "", message: "" });
        setFiles([]);
      } else {
        setStatus("error");
        setErrorMsg(data.error || "Bir hata oluştu, lütfen tekrar deneyin.");
      }
    } catch {
      setStatus("error");
      setErrorMsg("Bir hata oluştu, lütfen tekrar deneyin.");
    }
  }

  if (status === "success") {
    return (
      <div
        className="text-center py-16 border-2 border-accent/30 animate-fade-up"
        role="status"
      >
        <h2 className="font-display text-2xl font-bold text-ink mb-2">
          Teşekkürler!
        </h2>
        <p className="font-serif text-base text-soft-black/70">
          Mesajınız iletildi. En kısa sürede dönüş yapacağız.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 animate-fade-up stagger-1"
      noValidate
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label
            htmlFor="contact-name"
            className="block font-sans text-[0.65rem] uppercase tracking-[0.2em] text-warm-gray mb-2"
          >
            Ad Soyad
          </label>
          <input
            id="contact-name"
            type="text"
            required
            autoComplete="name"
            maxLength={200}
            value={formData.name}
            onChange={(e) =>
              setFormData({ ...formData, name: e.target.value })
            }
            className="w-full px-4 py-3 border border-ink/20 bg-transparent font-serif text-base text-ink focus:outline-none focus:border-accent"
          />
        </div>
        <div>
          <label
            htmlFor="contact-email"
            className="block font-sans text-[0.65rem] uppercase tracking-[0.2em] text-warm-gray mb-2"
          >
            E-posta
          </label>
          <input
            id="contact-email"
            type="email"
            required
            autoComplete="email"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            className="w-full px-4 py-3 border border-ink/20 bg-transparent font-serif text-base text-ink focus:outline-none focus:border-accent"
          />
        </div>
      </div>
      <div>
        <label
          htmlFor="contact-subject"
          className="block font-sans text-[0.65rem] uppercase tracking-[0.2em] text-warm-gray mb-2"
        >
          Konu
        </label>
        <input
          id="contact-subject"
          type="text"
          required
          maxLength={500}
          value={formData.subject}
          onChange={(e) =>
            setFormData({ ...formData, subject: e.target.value })
          }
          className="w-full px-4 py-3 border border-ink/20 bg-transparent font-serif text-base text-ink focus:outline-none focus:border-accent"
        />
      </div>
      <div>
        <label
          htmlFor="contact-message"
          className="block font-sans text-[0.65rem] uppercase tracking-[0.2em] text-warm-gray mb-2"
        >
          Mesaj
        </label>
        <textarea
          id="contact-message"
          required
          rows={6}
          maxLength={5000}
          value={formData.message}
          onChange={(e) =>
            setFormData({ ...formData, message: e.target.value })
          }
          className="w-full px-4 py-3 border border-ink/20 bg-transparent font-serif text-base text-ink focus:outline-none focus:border-accent resize-none"
        />
      </div>

      {/* Görsel / Video yükleme */}
      <div>
        <label
          htmlFor="contact-attachments"
          className="block font-sans text-[0.65rem] uppercase tracking-[0.2em] text-warm-gray mb-2"
        >
          Görsel / Video{" "}
          <span className="lowercase tracking-normal text-warm-gray/70">
            (zorunlu değil)
          </span>
        </label>
        <div className="border-2 border-dashed border-ink/20 hover:border-accent/50 transition-colors p-5 text-center">
          <input
            ref={fileInputRef}
            id="contact-attachments"
            type="file"
            accept={ACCEPT}
            multiple
            onChange={handleFilesChange}
            className="sr-only"
          />
          <label
            htmlFor="contact-attachments"
            className="cursor-pointer inline-flex flex-col items-center gap-2"
          >
            <span className="font-sans text-xs uppercase tracking-[0.2em] text-ink">
              Dosya Seç
            </span>
            <span className="font-serif text-sm text-warm-gray">
              Sanatını tanıtmak için görsel veya video ekleyebilirsin
            </span>
            <span className="font-sans text-[0.6rem] uppercase tracking-[0.15em] text-warm-gray/70">
              Görsel · Video — Toplam 80 MB'a kadar
            </span>
          </label>
        </div>

        {files.length > 0 && (
          <ul className="mt-4 space-y-2">
            {files.map((f) => {
              const key = `${f.name}-${f.size}`;
              return (
                <li
                  key={key}
                  className="flex items-center justify-between gap-3 px-3 py-2 border border-ink/10 bg-paper/30"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-sans text-xs text-ink truncate">
                      {f.name}
                    </p>
                    <p className="font-sans text-[0.6rem] text-warm-gray">
                      {humanSize(f.size)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFile(key)}
                    className="font-sans text-[0.65rem] uppercase tracking-[0.15em] text-accent hover:text-accent-dark"
                    aria-label={`${f.name} dosyasını kaldır`}
                  >
                    Kaldır
                  </button>
                </li>
              );
            })}
            <li
              className={`font-sans text-[0.65rem] ${
                overLimit ? "text-accent" : "text-warm-gray"
              }`}
            >
              Toplam: {humanSize(totalBytes)}{" "}
              {overLimit && " — limit aşıldı"}
            </li>
          </ul>
        )}
      </div>

      <button
        type="submit"
        disabled={status === "loading" || overLimit}
        className="px-8 py-3 bg-ink text-cream font-sans text-xs uppercase tracking-[0.2em] border border-ink hover:bg-accent hover:border-accent transition-colors disabled:opacity-50"
      >
        {status === "loading" ? "Gönderiliyor..." : "Gönder"}
      </button>
      {status === "error" && (
        <p className="font-sans text-xs text-accent" role="alert">
          {errorMsg || "Bir hata oluştu, lütfen tekrar deneyin."}
        </p>
      )}
    </form>
  );
}
