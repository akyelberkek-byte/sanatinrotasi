"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { urlFor } from "@/sanity/image";

type Artwork = {
  _id: string;
  title: string;
  artist: string;
  year?: string;
  medium?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  image: any;
  description?: string;
  sourceUrl?: string;
};

interface Props {
  artworks: Artwork[];
}

/**
 * Günün Eseri — Met Museum tarzı küçük editorial widget.
 * Havuzdan tarihe göre deterministik seçim (aynı günde aynı eser → cache friendly).
 * Mount sonrası rastgele de değiştirilebilir (ileride).
 */
export default function DailyArtwork({ artworks }: Props) {
  const [active, setActive] = useState<Artwork | null>(null);

  useEffect(() => {
    if (!artworks || artworks.length === 0) return;
    // Tarih bazlı seed → aynı günde aynı eser
    const today = new Date();
    const dayOfYear = Math.floor(
      (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) /
        (1000 * 60 * 60 * 24),
    );
    const idx = dayOfYear % artworks.length;
    setActive(artworks[idx]);
  }, [artworks]);

  if (!active || !artworks || artworks.length === 0) return null;
  const imgUrl = active.image?.asset
    ? urlFor(active.image).width(800).height(900).fit("max").url()
    : null;
  if (!imgUrl) return null;

  return (
    <section className="py-12 md:py-16 border-t-2 border-ink animate-fade-up">
      <div className="flex items-center gap-3 mb-6">
        <span className="font-sans text-[0.6rem] uppercase tracking-[0.3em] text-accent border border-accent/40 px-2 py-1">
          Günün Eseri
        </span>
        <span className="font-sans text-[0.65rem] uppercase tracking-[0.2em] text-warm-gray">
          {new Date().toLocaleDateString("tr-TR", {
            day: "2-digit",
            month: "long",
            year: "numeric",
          })}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr] gap-8 md:gap-12 items-start">
        <div className="relative aspect-[4/5] bg-paper">
          <Image
            src={imgUrl}
            alt={`${active.title} — ${active.artist}`}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-contain"
          />
        </div>
        <div className="md:pt-8">
          <p className="font-sans text-[0.65rem] uppercase tracking-[0.25em] text-warm-gray mb-2">
            {active.artist}
          </p>
          <h3 className="font-display text-2xl md:text-3xl font-bold text-ink leading-tight">
            {active.title}
          </h3>
          <div className="flex items-center gap-3 mt-3 font-sans text-[0.7rem] text-soft-black/70">
            {active.year && <span>{active.year}</span>}
            {active.year && active.medium && <span>·</span>}
            {active.medium && <span>{active.medium}</span>}
          </div>
          {active.description && (
            <p className="font-serif text-base md:text-lg text-soft-black leading-relaxed mt-5 max-w-xl">
              {active.description}
            </p>
          )}
          {active.sourceUrl && (
            <a
              href={active.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-6 font-sans text-[0.65rem] uppercase tracking-[0.25em] text-accent hover:text-accent-dark transition-colors link-underline"
            >
              Kaynak →
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
