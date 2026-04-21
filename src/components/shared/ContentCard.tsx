import Link from "next/link";
import Image from "next/image";
import { urlFor } from "@/sanity/image";
import { turkishSlugify } from "@/sanity/lib/slugify";

/**
 * Yazılar veya Rotaları tek listede gösteren birleşik kart.
 * _type=="route" ise rota sayfasına, aksi halde yazı sayfasına yönlendirir.
 * Rota kartında kategori etiketi "Rota" olarak, ayrıca şehir + durak sayısı rozeti görünür.
 */
interface ContentCardProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  item: any;
  featured?: boolean;
}

export default function ContentCard({ item, featured = false }: ContentCardProps) {
  const isRoute = item._type === "route";
  const baseHref = isRoute ? "/rotalar" : "/yazilar";
  const slugStr = item.slug?.current || "";
  const href = `${baseHref}/${turkishSlugify(slugStr)}`;

  const date = item.publishedAt
    ? new Date(item.publishedAt).toLocaleDateString("tr-TR", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "";

  return (
    <Link
      href={href}
      className={`group block ${featured ? "" : "border-t-2 border-ink pt-4"}`}
    >
      {item.mainImage && (
        <div className="relative overflow-hidden mb-4 aspect-[16/10]">
          <Image
            src={urlFor(item.mainImage).width(800).height(500).url()}
            alt={item.mainImage.alt || item.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            loading="lazy"
            className="object-cover transition-transform duration-500 group-hover:scale-105 grayscale-[15%] group-hover:grayscale-0"
          />
          {/* Kategori / Tip etiketi */}
          <span
            className={`absolute top-3 left-3 px-3 py-1 font-sans text-[0.6rem] uppercase tracking-[0.2em] ${
              isRoute ? "bg-accent text-cream" : "bg-ink/80 text-cream"
            }`}
          >
            {isRoute ? "Rota" : item.category?.title || "Yazı"}
          </span>
          {/* Rota için şehir + durak sayısı */}
          {isRoute && (item.city || item.stopCount) && (
            <span className="absolute top-3 right-3 bg-ink/80 text-cream px-2 py-1 font-sans text-[0.55rem] uppercase tracking-[0.15em]">
              {item.city}
              {item.city && item.stopCount ? " · " : ""}
              {item.stopCount ? `${item.stopCount} durak` : ""}
            </span>
          )}
        </div>
      )}
      <h3
        className={`font-display font-bold text-ink group-hover:text-accent transition-colors ${
          featured ? "text-2xl md:text-3xl" : "text-lg md:text-xl"
        } leading-tight mb-2`}
      >
        {item.title}
      </h3>
      {item.excerpt && (
        <p className="font-serif text-soft-black/80 text-sm md:text-base leading-relaxed mb-2 line-clamp-2">
          {item.excerpt}
        </p>
      )}
      <div className="flex items-center gap-3 font-sans text-[0.65rem] uppercase tracking-[0.2em] text-warm-gray">
        {item.author?.name && <span>{item.author.name}</span>}
        {item.author?.name && date && <span>·</span>}
        {date && <span>{date}</span>}
        {isRoute && item.duration && (
          <>
            <span>·</span>
            <span>{item.duration}</span>
          </>
        )}
      </div>
    </Link>
  );
}
