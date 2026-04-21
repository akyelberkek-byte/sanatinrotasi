import { client } from "@/sanity/client";
import {
  ARTICLES_AND_ROUTES_QUERY,
  CATEGORIES_QUERY,
  SITE_SETTINGS_QUERY,
} from "@/sanity/queries";
import ContentCard from "@/components/shared/ContentCard";
import SectionLabel from "@/components/shared/SectionLabel";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Yazılar",
  description: "Sanatın Rotası'nın editöryel içerikleri, sanat kritikleri ve röportajları.",
};

export const revalidate = 60;

export default async function YazilarPage() {
  // Yazılar + Rotalar birleşik feed — rotalar ayrıca /rotalar'da da listeleniyor,
  // ama burada da görünür olsun (kullanıcı tek yerden tüm içeriği tarayabilsin).
  const [items, categories, settings] = await Promise.all([
    client.fetch(ARTICLES_AND_ROUTES_QUERY, { limit: 60 }),
    client.fetch(CATEGORIES_QUERY),
    client.fetch(SITE_SETTINGS_QUERY).catch(() => null),
  ]);
  const emptyText =
    settings?.emptyArticlesText || "Henüz yayınlanmış yazı bulunmuyor.";

  return (
    <div className="max-w-7xl mx-auto px-6 md:px-12 py-12">
      <header className="mb-10 animate-fade-up">
        <SectionLabel label="Yazılar" className="mb-3 block" />
        <h1 className="font-display text-4xl md:text-5xl font-bold text-ink">
          Editöryel <span className="italic text-accent">İçerikler</span>
        </h1>
        <p className="font-serif text-lg text-soft-black/70 mt-3 max-w-2xl">
          Görsel sanatlardan müziğe, sinemadan edebiyata — sanatın her alanından
          derinlikli yazılar, kritikler ve röportajlar.
        </p>
      </header>

      {/* Category filter */}
      {categories && categories.length > 0 && (
        <div className="flex flex-wrap gap-3 mb-10 animate-fade-up stagger-1">
          <Link
            href="/yazilar"
            className="font-sans text-[0.65rem] uppercase tracking-[0.2em] px-4 py-2 border border-ink text-ink hover:bg-ink hover:text-cream transition-colors"
          >
            Tümü
          </Link>
          {categories.map((cat: any) => (
            <Link
              key={cat._id}
              href={`/kategori/${cat.slug.current}`}
              className="font-sans text-[0.65rem] uppercase tracking-[0.2em] px-4 py-2 border border-ink/20 text-soft-black hover:border-accent hover:text-accent transition-colors"
            >
              {cat.title}
            </Link>
          ))}
        </div>
      )}

      {/* Articles + Rotalar grid */}
      {items && items.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-fade-up stagger-2">
          {items.map((item: any) => (
            <ContentCard key={item._id} item={item} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <p className="font-serif text-xl text-warm-gray italic">
            {emptyText}
          </p>
          <p className="font-sans text-sm text-warm-gray mt-2">
            İlk yazılar çok yakında burada olacak.
          </p>
        </div>
      )}
    </div>
  );
}
