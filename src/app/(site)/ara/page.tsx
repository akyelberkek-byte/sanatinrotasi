import type { Metadata } from "next";
import SearchClient from "./SearchClient";

export const metadata: Metadata = {
  title: "Ara",
  description: "Sanatın Rotası içinde yazı, etkinlik ve rota ara",
};

export default function SearchPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 md:px-12 py-12">
      <header className="mb-10 animate-fade-up">
        <p className="font-sans text-[0.65rem] uppercase tracking-[0.25em] text-accent mb-2">
          Keşfet
        </p>
        <h1 className="font-display text-3xl md:text-5xl font-bold text-ink leading-tight">
          Arama
        </h1>
        <p className="font-serif text-base md:text-lg text-soft-black/80 mt-4 max-w-2xl">
          Yazılar, etkinlikler ve rotalar arasında ara.
        </p>
      </header>

      <SearchClient />
    </div>
  );
}
