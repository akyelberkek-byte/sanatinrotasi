"use client";

import { useState } from "react";

export default function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("Sadece sanat. Asla spam değil.");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      setMessage("Lütfen geçerli bir e-posta adresi girin.");
      setStatus("error");
      return;
    }

    setStatus("loading");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        setStatus("success");
        setMessage("Teşekkürler! Rotaya dahil oldunuz.");
        setEmail("");
      } else {
        setStatus("error");
        setMessage("Bir hata oluştu, lütfen tekrar deneyin.");
      }
    } catch {
      setStatus("error");
      setMessage("Bir hata oluştu, lütfen tekrar deneyin.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col items-center gap-4" aria-label="Bulten aboneligi">
      <div className="flex flex-col sm:flex-row w-full max-w-md">
        <label htmlFor="newsletter-email" className="sr-only">
          E-posta adresiniz
        </label>
        <input
          id="newsletter-email"
          type="email"
          placeholder="E-posta adresiniz"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={status === "success"}
          autoComplete="email"
          className="flex-1 px-4 py-3 border border-ink/20 sm:border-r-0 bg-transparent font-serif text-base text-ink placeholder:text-warm-gray focus:outline-none focus:border-accent disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={status === "success" || status === "loading"}
          className="px-6 py-3 bg-ink text-cream font-sans text-xs uppercase tracking-[0.2em] border border-ink hover:bg-accent hover:border-accent transition-colors disabled:bg-warm-gray disabled:border-warm-gray"
        >
          {status === "success" ? "Kaydedildi" : status === "loading" ? "..." : "Kayit Ol"}
        </button>
      </div>
      <p
        role={status === "error" || status === "success" ? "status" : undefined}
        aria-live="polite"
        className={`font-sans text-xs ${status === "error" ? "text-accent" : status === "success" ? "text-accent" : "text-warm-gray"}`}
      >
        {message}
      </p>
    </form>
  );
}
