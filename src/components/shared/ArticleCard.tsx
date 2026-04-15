import Link from "next/link";
import Image from "next/image";
import { urlFor } from "@/sanity/image";

interface ArticleCardProps {
  article: {
    title: string;
    slug: { current: string };
    publishedAt: string;
    excerpt?: string;
    mainImage?: any;
    author?: { name: string };
    category?: { title: string; slug: { current: string }; color?: string };
  };
  featured?: boolean;
}

export default function ArticleCard({ article, featured = false }: ArticleCardProps) {
  const date = article.publishedAt
    ? new Date(article.publishedAt).toLocaleDateString("tr-TR", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "";

  return (
    <Link
      href={`/yazilar/${article.slug.current}`}
      className={`group block ${featured ? "" : "border-t-2 border-ink pt-4"}`}
    >
      {article.mainImage && (
        <div className="relative overflow-hidden mb-4 aspect-[16/10]">
          <Image
            src={urlFor(article.mainImage).width(800).height(500).url()}
            alt={article.mainImage.alt || article.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            loading="lazy"
            className="object-cover transition-transform duration-500 group-hover:scale-105 grayscale-[15%] group-hover:grayscale-0"
          />
          {article.category && (
            <span className="absolute top-3 left-3 bg-ink/80 text-cream px-3 py-1 font-sans text-[0.6rem] uppercase tracking-[0.2em]">
              {article.category.title}
            </span>
          )}
        </div>
      )}
      <h3
        className={`font-display font-bold text-ink group-hover:text-accent transition-colors ${featured ? "text-2xl md:text-3xl" : "text-lg md:text-xl"} leading-tight mb-2`}
      >
        {article.title}
      </h3>
      {article.excerpt && (
        <p className="font-serif text-soft-black/80 text-sm md:text-base leading-relaxed mb-2 line-clamp-2">
          {article.excerpt}
        </p>
      )}
      <div className="flex items-center gap-3 font-sans text-[0.65rem] uppercase tracking-[0.2em] text-warm-gray">
        {article.author && <span>{article.author.name}</span>}
        {article.author && date && <span>·</span>}
        {date && <span>{date}</span>}
      </div>
    </Link>
  );
}
