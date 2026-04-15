"use client";

import { useState } from "react";
import SectionLabel from "@/components/shared/SectionLabel";

export default function IletisimPage() {
  const [formData, setFormData] = useState({ name: "", email: "", subject: "", message: "" });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setStatus("success");
        setFormData({ name: "", email: "", subject: "", message: "" });
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-6 md:px-12 py-12">
      <header className="mb-10 animate-fade-up">
        <SectionLabel label="İletişim" className="mb-3 block" />
        <h1 className="font-display text-4xl md:text-5xl font-bold text-ink">
          Bize <span className="italic text-accent">Ulaşın</span>
        </h1>
        <p className="font-serif text-lg text-soft-black/70 mt-3">
          İş birliği, öneri veya sorularınız için bize yazın.
        </p>
      </header>

      {status === "success" ? (
        <div className="text-center py-16 border-2 border-accent/30 animate-fade-up">
          <h2 className="font-display text-2xl font-bold text-ink mb-2">Teşekkürler!</h2>
          <p className="font-serif text-base text-soft-black/70">
            Mesajınız iletildi. En kısa sürede dönüş yapacağız.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6 animate-fade-up stagger-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block font-sans text-[0.65rem] uppercase tracking-[0.2em] text-warm-gray mb-2">
                Ad Soyad
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 border border-ink/20 bg-transparent font-serif text-base text-ink focus:outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="block font-sans text-[0.65rem] uppercase tracking-[0.2em] text-warm-gray mb-2">
                E-posta
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 border border-ink/20 bg-transparent font-serif text-base text-ink focus:outline-none focus:border-accent"
              />
            </div>
          </div>
          <div>
            <label className="block font-sans text-[0.65rem] uppercase tracking-[0.2em] text-warm-gray mb-2">
              Konu
            </label>
            <input
              type="text"
              required
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              className="w-full px-4 py-3 border border-ink/20 bg-transparent font-serif text-base text-ink focus:outline-none focus:border-accent"
            />
          </div>
          <div>
            <label className="block font-sans text-[0.65rem] uppercase tracking-[0.2em] text-warm-gray mb-2">
              Mesaj
            </label>
            <textarea
              required
              rows={6}
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              className="w-full px-4 py-3 border border-ink/20 bg-transparent font-serif text-base text-ink focus:outline-none focus:border-accent resize-none"
            />
          </div>
          <button
            type="submit"
            disabled={status === "loading"}
            className="px-8 py-3 bg-ink text-cream font-sans text-xs uppercase tracking-[0.2em] border border-ink hover:bg-accent hover:border-accent transition-colors disabled:opacity-50"
          >
            {status === "loading" ? "Gönderiliyor..." : "Gönder"}
          </button>
          {status === "error" && (
            <p className="font-sans text-xs text-accent">
              Bir hata oluştu, lütfen tekrar deneyin.
            </p>
          )}
        </form>
      )}
    </div>
  );
}
