import Image from "next/image";
import Link from "next/link";
import { PortableText } from "@portabletext/react";
import { client } from "@/sanity/client";
import { urlFor } from "@/sanity/image";
import {
  FEATURED_ARTICLES_QUERY,
  EVENTS_QUERY,
  ROUTES_QUERY,
  SITE_SETTINGS_QUERY,
  CATEGORIES_QUERY,
  FOUNDER_QUERY,
} from "@/sanity/queries";
import ArticleCard from "@/components/shared/ArticleCard";
import EventCard from "@/components/shared/EventCard";
import RouteCard from "@/components/shared/RouteCard";
import SectionLabel from "@/components/shared/SectionLabel";
import NewsletterForm from "@/components/shared/NewsletterForm";
import Ornament from "@/components/shared/Ornament";

export const revalidate = 60;

export default async function HomePage() {
  const [settings, articles, events, routes, categories, founder] = await Promise.all([
    client.fetch(SITE_SETTINGS_QUERY),
    client.fetch(FEATURED_ARTICLES_QUERY),
    client.fetch(EVENTS_QUERY, { limit: 4 }),
    client.fetch(ROUTES_QUERY),
    client.fetch(CATEGORIES_QUERY),
    client.fetch(FOUNDER_QUERY),
  ]);

  const logoUrl = settings?.logo
    ? urlFor(settings.logo).width(200).height(200).url()
    : "/images/logo.png";

  const founderImageUrl = founder?.image
    ? urlFor(founder.image).width(840).height(940).url()
    : "/images/ela-kantarci.jpg";

  return (
    <div className="max-w-7xl mx-auto px-6 md:px-12">
      {/* Hero / Masthead */}
      <header className="text-center py-12 md:py-20 border-b-2 border-ink animate-fade-up">
        <Image
          src={logoUrl}
          alt="Sanatın Rotası Logo"
          width={90}
          height={90}
          unoptimized={!!settings?.logo}
          className="mx-auto mb-6"
          priority
        />
        <h1 className="font-display text-5xl md:text-7xl lg:text-[7rem] font-black text-ink leading-[0.9] tracking-tight">
          {settings?.heroHeading || "Sanatın"}
          <span className="block font-serif italic text-accent font-light text-[0.7em]">
            {settings?.heroHeadingItalic || "Rotası"}
          </span>
        </h1>
        <p className="font-sans text-[0.7rem] uppercase tracking-[0.3em] text-warm-gray mt-6">
          {settings?.heroSubheading || "Türkiye'nin Sanat & Kültür Platformu"}
        </p>
        {settings?.heroDescription && (
          <p className="font-serif text-xl md:text-2xl font-bold text-ink mt-6 max-w-2xl mx-auto leading-relaxed whitespace-pre-line">
            {settings.heroDescription}
          </p>
        )}
      </header>

      {/* Editorial Section — Manifesto + Founder */}
      <section className="grid grid-cols-1 md:grid-cols-[1fr_1px_1fr] gap-0 py-12 md:py-16 animate-fade-up stagger-2 md:items-center">
        {/* Left — Manifesto */}
        <div className="pr-0 md:pr-10">
          <SectionLabel label={settings?.manifestoLabel || "Manifesto"} className="mb-4 block" />
          <div className="font-serif text-xl md:text-2xl leading-relaxed text-soft-black drop-cap portable-text">
            {settings?.manifesto ? (
              <PortableText value={settings.manifesto} />
            ) : (
              <p>
                Her sanat eseri bir yolculuk, her sergi bir durak, her sanatçı bir rehberdir.
              </p>
            )}
          </div>
        </div>

        {/* Divider */}
        <div className="hidden md:block bg-ink/15" />

        {/* Right — Founder */}
        {founder && (
          <div className="pl-0 md:pl-10 mt-10 md:mt-0">
            <SectionLabel label={settings?.founderLabel || "Kurucu"} className="mb-4 block" />
            <div className="relative mb-4 max-w-[420px]">
              <Image
                src={founderImageUrl}
                alt={`${founder.name} — ${founder.role || ""}`}
                width={420}
                height={470}
                loading="lazy"
                unoptimized={!!founder.image}
                className="w-full grayscale-[15%] hover:grayscale-0 transition-all duration-500"
              />
              <div className="absolute inset-[8px] border border-white/40 pointer-events-none" />
            </div>
            <h3 className="font-display text-xl font-bold text-ink">{founder.name}</h3>
            {founder.role && (
              <p className="font-sans text-[0.65rem] uppercase tracking-[0.2em] text-accent mt-1 mb-3">
                {founder.role}
              </p>
            )}
            {founder.homepageBio && (
              <p className="font-serif text-base leading-relaxed text-soft-black whitespace-pre-line">
                {founder.homepageBio}
              </p>
            )}
          </div>
        )}
      </section>

      {/* Categories */}
      {categories && categories.length > 0 && (
        <section className="py-10 border-t-2 border-ink animate-fade-up stagger-3">
          <SectionLabel label={settings?.categoriesLabel || "Kategoriler"} className="mb-6 block" />
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {categories.map((cat: any) => (
              <Link
                key={cat._id}
                href={`/kategori/${cat.slug.current}`}
                className="group border border-ink/10 hover:border-accent/30 p-4 text-center transition-all hover:-translate-y-0.5"
              >
                <h3 className="font-display text-lg font-bold text-ink group-hover:text-accent transition-colors">
                  {cat.title}
                </h3>
                {cat.articleCount > 0 && (
                  <span className="font-sans text-[0.6rem] text-warm-gray mt-1 block">
                    {cat.articleCount} yazı
                  </span>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Featured Articles */}
      {articles && articles.length > 0 && (
        <section className="py-10 border-t-2 border-ink animate-fade-up stagger-3">
          <div className="flex justify-between items-baseline mb-8">
            <SectionLabel label={settings?.latestArticlesLabel || "Son Yazılar"} />
            <Link
              href="/yazilar"
              className="font-sans text-[0.65rem] uppercase tracking-[0.2em] text-accent link-underline"
            >
              {settings?.viewAllLabel || "Tümünü Gör"}
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {articles.map((article: any) => (
              <ArticleCard key={article._id} article={article} />
            ))}
          </div>
        </section>
      )}

      {/* Featured Events */}
      {events && events.length > 0 && (
        <section className="py-10 border-t-2 border-ink animate-fade-up stagger-4">
          <div className="flex justify-between items-baseline mb-8">
            <SectionLabel label={settings?.upcomingEventsLabel || "Yaklaşan Etkinlikler"} />
            <Link
              href="/etkinlikler"
              className="font-sans text-[0.65rem] uppercase tracking-[0.2em] text-accent link-underline"
            >
              {settings?.viewAllLabel || "Tümünü Gör"}
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {events.map((event: any) => (
              <EventCard key={event._id} event={event} />
            ))}
          </div>
        </section>
      )}

      {/* Featured Routes */}
      {routes && routes.length > 0 && (
        <section className="py-10 border-t-2 border-ink animate-fade-up stagger-4">
          <div className="flex justify-between items-baseline mb-8">
            <SectionLabel label={settings?.artRoutesLabel || "Sanat Rotaları"} />
            <Link
              href="/rotalar"
              className="font-sans text-[0.65rem] uppercase tracking-[0.2em] text-accent link-underline"
            >
              {settings?.viewAllLabel || "Tümünü Gör"}
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {routes.slice(0, 3).map((route: any) => (
              <RouteCard key={route._id} route={route} />
            ))}
          </div>
        </section>
      )}

      <Ornament />

      {/* Newsletter */}
      <section className="py-12 border-t-2 border-b-2 border-ink text-center">
        <h2 className="font-display text-3xl md:text-4xl font-bold text-ink mb-2">
          {settings?.newsletterTitle || "Rotaya"}{" "}
          <span className="italic text-accent">
            {settings?.newsletterTitleItalic || "Katıl"}
          </span>
        </h2>
        <p className="font-serif text-base text-soft-black/70 mb-8">
          {settings?.newsletterDescription ||
            "Yeni yazılar, etkinlikler ve rotalar hakkında ilk sen haberdar ol."}
        </p>
        <NewsletterForm noteText={settings?.newsletterNote} />
      </section>
    </div>
  );
}
