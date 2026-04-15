import { client } from "@/sanity/client";
import { ROUTE_BY_SLUG_QUERY } from "@/sanity/queries";
import { urlFor } from "@/sanity/image";
import { PortableText } from "@portabletext/react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import SectionLabel from "@/components/shared/SectionLabel";
import type { Metadata } from "next";

export const revalidate = 60;

const DIFFICULTY_LABELS: Record<string, string> = {
  kolay: "Kolay",
  orta: "Orta",
  uzun: "Uzun",
};

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const route = await client.fetch(ROUTE_BY_SLUG_QUERY, { slug });
  if (!route) return {};
  return {
    title: route.seo?.metaTitle || route.title,
    description: route.seo?.metaDescription || route.subtitle,
  };
}

export default async function RoutePage({ params }: Props) {
  const { slug } = await params;
  const route = await client.fetch(ROUTE_BY_SLUG_QUERY, { slug });
  if (!route) notFound();

  return (
    <article className="max-w-4xl mx-auto px-6 md:px-12 py-12">
      {/* Header */}
      <header className="mb-10 animate-fade-up">
        <SectionLabel label={route.city || "Rota"} className="mb-3 block" />
        <h1 className="font-display text-3xl md:text-5xl font-bold text-ink leading-tight">
          {route.title}
        </h1>
        {route.subtitle && (
          <p className="font-serif text-xl text-soft-black/70 italic mt-2">
            {route.subtitle}
          </p>
        )}
        <div className="flex items-center gap-4 mt-4 font-sans text-[0.7rem] uppercase tracking-[0.15em] text-warm-gray">
          {route.stops && <span>{route.stops.length} durak</span>}
          {route.duration && (
            <>
              <span>·</span>
              <span>{route.duration}</span>
            </>
          )}
          {route.difficulty && (
            <>
              <span>·</span>
              <span>{DIFFICULTY_LABELS[route.difficulty]}</span>
            </>
          )}
        </div>
      </header>

      {/* Main image */}
      {route.mainImage && (
        <div className="mb-10 animate-fade-up stagger-1">
          <Image
            src={urlFor(route.mainImage).width(1200).height(675).url()}
            alt={route.title}
            width={1200}
            height={675}
            className="w-full"
            priority
          />
        </div>
      )}

      {/* Description */}
      {route.description && (
        <div className="portable-text mb-12 animate-fade-up stagger-2">
          <PortableText value={route.description} />
        </div>
      )}

      {/* Stops */}
      {route.stops && route.stops.length > 0 && (
        <section className="animate-fade-up stagger-3">
          <SectionLabel label="Rotadaki Duraklar" className="mb-6 block" />
          <div className="space-y-8">
            {route.stops.map((stop: any, i: number) => (
              <div key={i} className="border-t-2 border-ink pt-6 grid grid-cols-1 md:grid-cols-[auto_1fr] gap-6">
                <div className="font-display text-3xl font-black text-accent/30">
                  {String(i + 1).padStart(2, "0")}
                </div>
                <div>
                  <h3 className="font-display text-xl font-bold text-ink">{stop.name}</h3>
                  {stop.description && (
                    <p className="font-serif text-base text-soft-black/80 mt-2 leading-relaxed">
                      {stop.description}
                    </p>
                  )}
                  {stop.image && (
                    <div className="mt-4">
                      <Image
                        src={urlFor(stop.image).width(800).height(450).url()}
                        alt={stop.name}
                        width={800}
                        height={450}
                        className="w-full"
                      />
                    </div>
                  )}
                  {stop.relatedArticle && (
                    <Link
                      href={`/yazilar/${stop.relatedArticle.slug.current}`}
                      className="inline-block mt-3 font-sans text-[0.65rem] uppercase tracking-[0.2em] text-accent link-underline"
                    >
                      İlgili Yazı: {stop.relatedArticle.title}
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Tags */}
      {route.tags && route.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-10 pt-6 border-t border-ink/10">
          {route.tags.map((tag: string) => (
            <span
              key={tag}
              className="font-sans text-[0.6rem] uppercase tracking-[0.15em] px-3 py-1 border border-ink/10 text-warm-gray"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </article>
  );
}
