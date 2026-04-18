import { PortableText } from "@portabletext/react";
import Image from "next/image";
import { client } from "@/sanity/client";
import { urlFor } from "@/sanity/image";
import { PAGE_BY_SLUG_QUERY, FOUNDER_QUERY } from "@/sanity/queries";
import SectionLabel from "@/components/shared/SectionLabel";
import type { Metadata } from "next";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const page = await client.fetch(PAGE_BY_SLUG_QUERY, { slug: "hakkinda" });
  return {
    title: page?.seo?.metaTitle || page?.title || "Hakkında",
    description:
      page?.seo?.metaDescription ||
      page?.subtitle ||
      "Sanatın Rotası hakkında — platform hikayesi, manifesto ve kurucu Ela Kantarcı.",
  };
}

export default async function HakkindaPage() {
  const [page, founder] = await Promise.all([
    client.fetch(PAGE_BY_SLUG_QUERY, { slug: "hakkinda" }),
    client.fetch(FOUNDER_QUERY),
  ]);

  const founderImageUrl = founder?.image
    ? urlFor(founder.image).width(400).height(448).url()
    : "/images/ela-kantarci.jpg";

  return (
    <div className="max-w-4xl mx-auto px-6 md:px-12 py-12">
      {/* Hero */}
      <header className="mb-12 animate-fade-up">
        <SectionLabel label={page?.sectionLabel || "Hakkında"} className="mb-3 block" />
        <h1 className="font-display text-4xl md:text-5xl font-bold text-ink">
          {page?.headingPrefix || "Sanatın Rotası"}{" "}
          <span className="italic text-accent">
            {page?.headingHighlight || "Hakkında"}
          </span>
        </h1>
        {page?.subtitle && (
          <p className="font-serif text-lg text-soft-black/70 mt-3 max-w-2xl">
            {page.subtitle}
          </p>
        )}
      </header>

      {/* Founder */}
      {founder && (
        <section className="mb-16 animate-fade-up stagger-1">
          <SectionLabel label="Kurucu" className="mb-6 block" />
          <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-10">
            <div>
              <div className="relative">
                <Image
                  src={founderImageUrl}
                  alt={`${founder.name} — ${founder.role || ""}`}
                  width={300}
                  height={336}
                  loading="lazy"
                  unoptimized={!!founder.image}
                  className="w-full grayscale-[15%] hover:grayscale-0 transition-all duration-500"
                />
                <div className="absolute inset-[8px] border border-white/40 pointer-events-none" />
              </div>
            </div>
            <div>
              <h2 className="font-display text-2xl font-bold text-ink">{founder.name}</h2>
              {founder.role && (
                <p className="font-sans text-[0.7rem] uppercase tracking-[0.2em] text-accent mt-1 mb-4">
                  {founder.role}
                </p>
              )}
              {founder.bio && founder.bio.length > 0 ? (
                <div className="font-serif text-lg leading-relaxed text-soft-black portable-text">
                  <PortableText value={founder.bio} />
                </div>
              ) : founder.homepageBio ? (
                <p className="font-serif text-lg leading-relaxed text-soft-black whitespace-pre-line">
                  {founder.homepageBio}
                </p>
              ) : null}
            </div>
          </div>
        </section>
      )}

      {/* Page Body (Manifesto, Vizyon, Misyon ve diğer içerikler) */}
      {page?.body && (
        <section className="animate-fade-up stagger-2 portable-text">
          <PortableText value={page.body} />
        </section>
      )}
    </div>
  );
}
