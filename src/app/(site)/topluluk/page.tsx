import { PortableText } from "@portabletext/react";
import { client } from "@/sanity/client";
import { PAGE_BY_SLUG_QUERY, SITE_SETTINGS_QUERY } from "@/sanity/queries";
import SectionLabel from "@/components/shared/SectionLabel";
import NewsletterForm from "@/components/shared/NewsletterForm";
import type { Metadata } from "next";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const page = await client.fetch(PAGE_BY_SLUG_QUERY, { slug: "topluluk" });
  return {
    title: page?.seo?.metaTitle || page?.title || "Topluluk",
    description:
      page?.seo?.metaDescription ||
      page?.subtitle ||
      "Sanatın Rotası topluluğuna katılın — bülten, sosyal medya ve daha fazlası.",
  };
}

export default async function ToplulukPage() {
  const [page, settings] = await Promise.all([
    client.fetch(PAGE_BY_SLUG_QUERY, { slug: "topluluk" }),
    client.fetch(SITE_SETTINGS_QUERY),
  ]);

  return (
    <div className="max-w-4xl mx-auto px-6 md:px-12 py-12">
      <header className="mb-12 animate-fade-up">
        <SectionLabel label={page?.sectionLabel || "Topluluk"} className="mb-3 block" />
        <h1 className="font-display text-4xl md:text-5xl font-bold text-ink">
          {page?.headingPrefix || "Rotaya"}{" "}
          <span className="italic text-accent">
            {page?.headingHighlight || "Katıl"}
          </span>
        </h1>
        {page?.subtitle && (
          <p className="font-serif text-lg text-soft-black/70 mt-3 max-w-2xl">
            {page.subtitle}
          </p>
        )}
      </header>

      {/* Sanatını Tanıt — Sanity'de veri olmasa bile varsayılan metinle render edilir */}
      <section className="mb-16 p-8 md:p-12 border-2 border-accent/30 bg-accent/5 animate-fade-up stagger-1 text-center">
        <SectionLabel
          label={settings?.submitArtLabel || "Sanatını Tanıt"}
          className="mb-3 block"
        />
        <h2 className="font-display text-2xl md:text-3xl font-bold text-ink mb-4 leading-tight">
          {settings?.submitArtHeading || "Sanatını"}{" "}
          <span className="italic text-accent">
            {settings?.submitArtHeadingItalic || "Tanıt"}
          </span>
        </h2>
        <p className="font-serif text-base md:text-lg leading-relaxed text-soft-black mb-6 max-w-2xl mx-auto whitespace-pre-line">
          {settings?.submitArtDescription ||
            "Üretimlerinle Sanatın Rotası'nda yer almak ister misin? Kendi sanatını, projelerini ya da hikayeni paylaşmak için bize ulaş. Seninle tanışmayı çok isteriz."}
        </p>
        <a
          href={settings?.submitArtCtaUrl || "/iletisim"}
          className="inline-flex items-center gap-2 px-6 py-3 bg-accent text-cream font-sans text-xs uppercase tracking-[0.2em] border-2 border-accent hover:bg-accent-dark hover:border-accent-dark transition-colors"
        >
          {settings?.submitArtCtaText || "Bize Ulaş"}
          <span aria-hidden="true">→</span>
        </a>
      </section>

      {/* Newsletter */}
      <section className="mb-16 p-8 md:p-12 border-2 border-ink animate-fade-up stagger-2">
        <h2 className="font-display text-2xl font-bold text-ink mb-2 text-center">
          {settings?.newsletterTitle || "Bülten"}{" "}
          <span className="italic text-accent">{settings?.newsletterTitleItalic || ""}</span>
        </h2>
        <p className="font-serif text-base text-soft-black/70 text-center mb-8">
          {settings?.newsletterDescription ||
            "Yeni yazılar, etkinlikler ve rotalar hakkında ilk sen haberdar ol."}
        </p>
        <NewsletterForm noteText={settings?.newsletterNote} />
      </section>

      {/* Page Body */}
      {page?.body && (
        <section className="portable-text animate-fade-up stagger-2">
          <PortableText value={page.body} />
        </section>
      )}

      {/* Social */}
      {(() => {
        const socials: { label: string; url?: string }[] = [
          { label: "Instagram", url: settings?.socialLinks?.instagram },
          { label: "YouTube", url: settings?.socialLinks?.youtube },
          { label: "Pinterest", url: settings?.socialLinks?.pinterest },
          { label: "Udemy", url: settings?.socialLinks?.udemy },
          { label: "X", url: settings?.socialLinks?.twitter },
        ];

        return (
          <section className="mt-16 animate-fade-up stagger-3">
            <SectionLabel label="Sosyal Medya" className="mb-6 block" />
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {socials.map((s) => {
                const isExternal = !!s.url;
                const href = s.url || "/";
                return (
                  <a
                    key={s.label}
                    href={href}
                    target={isExternal ? "_blank" : undefined}
                    rel={isExternal ? "noopener noreferrer" : undefined}
                    className="block p-8 border border-ink/10 hover:border-accent/30 transition-colors group"
                  >
                    <h3 className="font-display text-xl font-bold text-ink group-hover:text-accent transition-colors">
                      {s.label}
                    </h3>
                  </a>
                );
              })}
            </div>
          </section>
        );
      })()}
    </div>
  );
}
