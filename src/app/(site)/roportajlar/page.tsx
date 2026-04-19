import { client } from "@/sanity/client";
import {
  ARTICLES_BY_CATEGORY_QUERY,
  CATEGORIES_QUERY,
  SITE_SETTINGS_QUERY,
} from "@/sanity/queries";
import ArticleCard from "@/components/shared/ArticleCard";
import SectionLabel from "@/components/shared/SectionLabel";
import Link from "next/link";
import type { Metadata } from "next";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Röportajlar",
  description:
    "Sanatçılarla, küratörlerle ve sanat dünyasının farklı isimleriyle yapılan röportajlar.",
};

export default async function RoportajlarPage() {
  const [articles, categories, settings] = await Promise.all([
    client.fetch(ARTICLES_BY_CATEGORY_QUERY, { categorySlug: "roportajlar" }),
    client.fetch(CATEGORIES_QUERY),
    client.fetch(SITE_SETTINGS_QUERY).catch(() => null),
  ]);

  const heading = settings?.roportajlarHeading || "Sanatın";
  const headingItalic = settings?.roportajlarHeadingItalic || "Sesleri";
  const description =
    settings?.roportajlarDescription ||
    "Sanatçılarla, küratörlerle ve sanat dünyasının farklı isimleriyle yapılan derinlikli röportajlar. Perde arkasındaki hikâyeler, üretim süreçleri ve sanatçı bakışları.";

  return (
    <div className="max-w-7xl mx-auto px-6 md:px-12 py-12">
      <header className="mb-10 animate-fade-up">
        <SectionLabel label="Röportajlar" className="mb-3 block" />
        <h1 className="font-display text-4xl md:text-5xl font-bold text-ink">
          {heading} <span className="italic text-accent">{headingItalic}</span>
        </h1>
        <p className="font-serif text-lg text-soft-black/70 mt-3 max-w-2xl">
          {description}
        </p>
      </header>

      {/* Kategori navigasyonu */}
      {categories && categories.length > 0 && (
        <div className="flex flex-wrap gap-3 mb-10 animate-fade-up stagger-1">
          <Link
            href="/yazilar"
            className="font-sans text-[0.65rem] uppercase tracking-[0.2em] px-4 py-2 border border-ink/20 text-soft-black hover:border-accent hover:text-accent transition-colors"
          >
            Tüm Yazılar
          </Link>
          {categories.map((cat: { _id: string; slug: { current: string }; title: string }) => (
            <Link
              key={cat._id}
              href={`/kategori/${cat.slug.current}`}
              className={`font-sans text-[0.65rem] uppercase tracking-[0.2em] px-4 py-2 border transition-colors ${
                cat.slug.current === "roportajlar"
                  ? "border-ink bg-ink text-cream"
                  : "border-ink/20 text-soft-black hover:border-accent hover:text-accent"
              }`}
            >
              {cat.title}
            </Link>
          ))}
        </div>
      )}

      {articles && articles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-fade-up stagger-2">
          {articles.map((article: { _id: string }) => (
            <ArticleCard key={article._id} article={article as never} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <p className="font-serif text-xl text-warm-gray italic">
            {settings?.emptyArticlesText?.replace("yazı", "röportaj") ||
              "Henüz yayınlanmış röportaj bulunmuyor."}
          </p>
          <p className="font-sans text-sm text-warm-gray mt-2">
            İlk röportajlar çok yakında burada olacak.
          </p>
        </div>
      )}
    </div>
  );
}
