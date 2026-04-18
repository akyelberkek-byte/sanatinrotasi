"use client";

import { useState } from "react";

export default function ContactForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");

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

  if (status === "success") {
    return (
      <div
        className="text-center py-16 border-2 border-accent/30 animate-fade-up"
        role="status"
      >
        <h2 className="font-display text-2xl font-bold text-ink mb-2">
          Tesekkurler!
        </h2>
        <p className="font-serif text-base text-soft-black/70">
          Mesajiniz iletildi. En kisa surede donus yapacagiz.
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
      <button
        type="submit"
        disabled={status === "loading"}
        className="px-8 py-3 bg-ink text-cream font-sans text-xs uppercase tracking-[0.2em] border border-ink hover:bg-accent hover:border-accent transition-colors disabled:opacity-50"
      >
        {status === "loading" ? "Gönderiliyor..." : "Gönder"}
      </button>
      {status === "error" && (
        <p className="font-sans text-xs text-accent" role="alert">
          Bir hata oluştu, lütfen tekrar deneyin.
        </p>
      )}
    </form>
  );
}
