import Link from "next/link";
import Image from "next/image";
import { urlFor } from "@/sanity/image";

interface Props {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  articles: any[];
}

/**
 * Editör Seçimi rotation — homepage'de büyük kart, en yeni 3 editor's pick.
 * Ela 'editorsPick' işaretlediği yazılar dönüyor.
 */
export default function EditorsPickSection({ articles }: Props) {
  if (!articles || articles.length === 0) return null;

  return (
    <section className="py-12 md:py-16 border-t-2 border-ink animate-fade-up">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <span className="font-sans text-[0.6rem] uppercase tracking-[0.3em] text-accent border border-accent/40 px-2 py-1">
            Editör Seçimi
          </span>
          <span className="font-sans text-[0.65rem] uppercase tracking-[0.2em] text-warm-gray">
            Bu Hafta
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
        {articles.map((article, i) => {
          const isFeatured = i === 0;
          return (
            <Link
              key={article._id}
              href={`/yazilar/${article.slug?.current}`}
              className={`group block ${isFeatured ? "md:col-span-2 md:row-span-1" : ""}`}
            >
              {article.mainImage && (
                <div
                  className={`relative overflow-hidden mb-4 ${
                    isFeatured ? "aspect-[16/10]" : "aspect-[4/3]"
                  }`}
                >
                  <Image
                    src={urlFor(article.mainImage).width(1200).height(800).url()}
                    alt={article.mainImage.alt || article.title}
                    fill
                    sizes={
                      isFeatured
                        ? "(max-width:768px) 100vw, 66vw"
                        : "(max-width:768px) 100vw, 33vw"
                    }
                    className="object-cover transition-transform duration-500 group-hover:scale-105 grayscale-[15%] group-hover:grayscale-0"
                  />
                </div>
              )}
              {article.category?.title && (
                <p className="font-sans text-[0.6rem] uppercase tracking-[0.2em] text-accent mb-1">
                  {article.category.title}
                </p>
              )}
              <h3
                className={`font-display font-bold text-ink group-hover:text-accent transition-colors leading-tight ${
                  isFeatured ? "text-2xl md:text-3xl" : "text-lg md:text-xl"
                }`}
              >
                {article.title}
              </h3>
              {article.excerpt && isFeatured && (
                <p className="font-serif text-soft-black/80 mt-2 line-clamp-2">
                  {article.excerpt}
                </p>
              )}
              {article.author?.name && (
                <p className="font-sans text-[0.65rem] uppercase tracking-[0.2em] text-warm-gray mt-2">
                  {article.author.name}
                </p>
              )}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
