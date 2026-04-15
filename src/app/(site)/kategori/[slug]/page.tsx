import { client } from "@/sanity/client";
import { ARTICLES_BY_CATEGORY_QUERY, CATEGORIES_QUERY } from "@/sanity/queries";
import ArticleCard from "@/components/shared/ArticleCard";
import SectionLabel from "@/components/shared/SectionLabel";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

export const revalidate = 60;

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const categories = await client.fetch(CATEGORIES_QUERY);
  const cat = categories?.find((c: any) => c.slug.current === slug);
  if (!cat) return {};
  return {
    title: cat.title,
    description: cat.description || `${cat.title} kategorisindeki yazılar.`,
  };
}

export default async function KategoriPage({ params }: Props) {
  const { slug } = await params;
  const [articles, categories] = await Promise.all([
    client.fetch(ARTICLES_BY_CATEGORY_QUERY, { categorySlug: slug }),
    client.fetch(CATEGORIES_QUERY),
  ]);

  const currentCategory = categories?.find((c: any) => c.slug.current === slug);
  if (!currentCategory) notFound();

  return (
    <div className="max-w-7xl mx-auto px-6 md:px-12 py-12">
      <header className="mb-10 animate-fade-up">
        <SectionLabel label="Kategori" className="mb-3 block" />
        <h1 className="font-display text-4xl md:text-5xl font-bold text-ink">
          {currentCategory.title}
        </h1>
        {currentCategory.description && (
          <p className="font-serif text-lg text-soft-black/70 mt-3 max-w-2xl">
            {currentCategory.description}
          </p>
        )}
      </header>

      {/* Category nav */}
      <div className="flex flex-wrap gap-3 mb-10 animate-fade-up stagger-1">
        <Link
          href="/yazilar"
          className="font-sans text-[0.65rem] uppercase tracking-[0.2em] px-4 py-2 border border-ink/20 text-soft-black hover:border-accent hover:text-accent transition-colors"
        >
          Tümü
        </Link>
        {categories?.map((cat: any) => (
          <Link
            key={cat._id}
            href={`/kategori/${cat.slug.current}`}
            className={`font-sans text-[0.65rem] uppercase tracking-[0.2em] px-4 py-2 border transition-colors ${
              cat.slug.current === slug
                ? "border-ink bg-ink text-cream"
                : "border-ink/20 text-soft-black hover:border-accent hover:text-accent"
            }`}
          >
            {cat.title}
          </Link>
        ))}
      </div>

      {articles && articles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-fade-up stagger-2">
          {articles.map((article: any) => (
            <ArticleCard key={article._id} article={article} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <p className="font-serif text-xl text-warm-gray italic">
            Bu kategoride henüz yazı bulunmuyor.
          </p>
        </div>
      )}
    </div>
  );
}
