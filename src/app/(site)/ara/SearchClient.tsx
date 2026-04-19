"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { urlFor } from "@/sanity/image";

type ArticleResult = {
  _id: string;
  title: string;
  slug: { current: string };
  excerpt?: string;
  publishedAt?: string;
  mainImage?: any;
  author?: { name: string };
  category?: { title: string; slug: { current: string } };
};

type EventResult = {
  _id: string;
  title: string;
  slug: { current: string };
  date?: string;
  location?: string;
  mainImage?: any;
};

type RouteResult = {
  _id: string;
  title: string;
  slug: { current: string };
  subtitle?: string;
  city?: string;
  mainImage?: any;
};

type Results = {
  articles: ArticleResult[];
  events: EventResult[];
  routes: RouteResult[];
  query: string;
};

export default function SearchClient() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Results | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults(null);
      setError(null);
      return;
    }

    const timer = setTimeout(() => {
      if (abortRef.current) abortRef.current.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setLoading(true);
      setError(null);

      fetch(`/api/search?q=${encodeURIComponent(trimmed)}`, {
        signal: controller.signal,
      })
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error("req"))))
        .then((data: Results) => {
          if (!mountedRef.current) return;
          setResults(data);
          setLoading(false);
        })
        .catch((e: unknown) => {
          if (e instanceof Error && e.name === "AbortError") return;
          if (!mountedRef.current) return;
          setError("Arama sırasında bir sorun oluştu.");
          setLoading(false);
        });
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const total = results
    ? results.articles.length + results.events.length + results.routes.length
    : 0;

  return (
    <div>
      <div className="border-b-2 border-ink pb-3 mb-8">
        <input
          type="search"
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value.slice(0, 100))}
          placeholder="Yazı, sanatçı, şehir, etiket ara..."
          className="w-full bg-transparent font-serif text-xl md:text-2xl text-ink placeholder:text-warm-gray/60 outline-none"
          aria-label="Arama"
        />
      </div>

      {loading && (
        <p className="font-sans text-[0.7rem] uppercase tracking-[0.2em] text-warm-gray">
          Aranıyor...
        </p>
      )}

      {error && (
        <p className="font-sans text-sm text-accent">{error}</p>
      )}

      {!loading && !error && query.trim().length >= 2 && results && total === 0 && (
        <p className="font-serif text-base text-warm-gray italic">
          &ldquo;{results.query}&rdquo; için sonuç bulunamadı.
        </p>
      )}

      {!loading && !error && results && total > 0 && (
        <div className="space-y-12">
          {results.articles.length > 0 && (
            <section>
              <h2 className="font-sans text-[0.7rem] uppercase tracking-[0.25em] text-accent mb-4">
                Yazılar ({results.articles.length})
              </h2>
              <ul className="divide-y divide-ink/10">
                {results.articles.map((a) => (
                  <li key={a._id} className="py-4">
                    <Link
                      href={`/yazilar/${a.slug.current}`}
                      className="flex gap-4 group"
                    >
                      {a.mainImage?.asset && (
                        <div className="relative w-24 h-16 md:w-32 md:h-20 flex-shrink-0 overflow-hidden">
                          <Image
                            src={urlFor(a.mainImage).width(200).height(130).url()}
                            alt={a.title}
                            fill
                            sizes="128px"
                            className="object-cover grayscale-[15%] group-hover:grayscale-0 transition"
                          />
                        </div>
                      )}
                      <div className="flex-1">
                        <h3 className="font-display text-lg md:text-xl font-bold text-ink group-hover:text-accent transition-colors leading-tight">
                          {a.title}
                        </h3>
                        {a.excerpt && (
                          <p className="font-serif text-sm text-soft-black/80 mt-1 line-clamp-2">
                            {a.excerpt}
                          </p>
                        )}
                        <div className="mt-1 font-sans text-[0.6rem] uppercase tracking-[0.2em] text-warm-gray">
                          {a.category?.title}
                          {a.author?.name && ` · ${a.author.name}`}
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {results.events.length > 0 && (
            <section>
              <h2 className="font-sans text-[0.7rem] uppercase tracking-[0.25em] text-accent mb-4">
                Etkinlikler ({results.events.length})
              </h2>
              <ul className="divide-y divide-ink/10">
                {results.events.map((e) => (
                  <li key={e._id} className="py-3">
                    <Link
                      href={`/etkinlikler/${e.slug.current}`}
                      className="block group"
                    >
                      <h3 className="font-display text-lg font-bold text-ink group-hover:text-accent transition-colors">
                        {e.title}
                      </h3>
                      <p className="font-sans text-[0.65rem] uppercase tracking-[0.2em] text-warm-gray mt-0.5">
                        {e.location}
                        {e.date && ` · ${new Date(e.date).toLocaleDateString("tr-TR")}`}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {results.routes.length > 0 && (
            <section>
              <h2 className="font-sans text-[0.7rem] uppercase tracking-[0.25em] text-accent mb-4">
                Rotalar ({results.routes.length})
              </h2>
              <ul className="divide-y divide-ink/10">
                {results.routes.map((r) => (
                  <li key={r._id} className="py-3">
                    <Link
                      href={`/rotalar/${r.slug.current}`}
                      className="block group"
                    >
                      <h3 className="font-display text-lg font-bold text-ink group-hover:text-accent transition-colors">
                        {r.title}
                      </h3>
                      <p className="font-sans text-[0.65rem] uppercase tracking-[0.2em] text-warm-gray mt-0.5">
                        {r.city}
                        {r.subtitle && ` · ${r.subtitle}`}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}

      {!loading && !error && query.trim().length < 2 && (
        <p className="font-serif text-base text-warm-gray italic">
          En az 2 karakter yaz.
        </p>
      )}
    </div>
  );
}
