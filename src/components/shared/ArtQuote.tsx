"use client";

import { useEffect, useState } from "react";

type Quote = { text: string; author?: string };

interface ArtQuoteProps {
  quotes: Quote[];
}

/**
 * Sanatın Sözü — rastgele bir alıntı gösterir.
 * Client component çünkü her yüklemede farklı olsun (hydration mismatch'i
 * önlemek için ilk render'da deterministik 0. index, mount sonrası rastgele).
 *
 * Sanatın Sözü Sanity'de boşsa varsayılan listeden bir alıntı gösterir.
 */

const DEFAULT_QUOTES: Quote[] = [
  {
    text: "Sanat, gerçeğin yalanıdır; bize gerçeği gösteren yalan.",
    author: "Pablo Picasso",
  },
  {
    text: "Sanatın amacı, hayatımızın tozunu ruhumuzdan silmek.",
    author: "Pablo Picasso",
  },
  {
    text: "Her sanat eseri, sanatçının kendisidir.",
    author: "Samuel Butler",
  },
  {
    text: "Sanat görünmez olanı görünür kılmaktır.",
    author: "Paul Klee",
  },
  {
    text: "Hayatımızda anlam olduğu için sanat vardır, çünkü sanat vardır hayatımız anlam kazanır.",
    author: "Friedrich Nietzsche",
  },
];

export default function ArtQuote({ quotes }: ArtQuoteProps) {
  // Sanity boşsa default kullan
  const list = quotes && quotes.length > 0 ? quotes : DEFAULT_QUOTES;
  // İlk render'da deterministik (SSR uyumu) — hidrasyon sonrası rastgele değişir
  const [idx, setIdx] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setIdx(Math.floor(Math.random() * list.length));
    setMounted(true);
  }, [list.length]);

  const quote = list[idx] ?? list[0];
  if (!quote?.text) return null;

  return (
    <figure
      className={`mx-auto max-w-2xl text-center mt-12 transition-all duration-700 ease-out ${
        mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
      }`}
      aria-label="Sanatın Sözü"
    >
      <div className="relative px-8">
        <span
          aria-hidden="true"
          className="absolute -top-2 -left-1 font-serif text-5xl text-accent leading-none select-none"
        >
          “
        </span>
        <blockquote className="font-serif text-base md:text-lg text-soft-black/85 leading-relaxed">
          {quote.text}
        </blockquote>
        <span
          aria-hidden="true"
          className="absolute -bottom-6 -right-1 font-serif text-5xl text-accent leading-none select-none"
        >
          ”
        </span>
      </div>
      {quote.author && (
        <figcaption className="font-sans text-[0.65rem] uppercase tracking-[0.25em] text-warm-gray mt-4">
          — {quote.author}
        </figcaption>
      )}
    </figure>
  );
}
