import { findArticleBySlug } from "@/sanity/lib/findArticle";
import { urlFor } from "@/sanity/image";
import { client } from "@/sanity/client";
import { COMMENTS_BY_ARTICLE_QUERY, RELATED_ARTICLES_QUERY } from "@/sanity/queries";
import ArticleCard from "@/components/shared/ArticleCard";
import { isAdminUser } from "@/lib/admin";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import PortableRenderer from "@/components/shared/PortableRenderer";
import CommentsSection from "@/components/shared/CommentsSection";
import FavoriteButton from "@/components/shared/FavoriteButton";
import { currentUser } from "@clerk/nextjs/server";
import { readingTimeMinutes } from "@/lib/readingTime";

export const revalidate = 60;

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = await findArticleBySlug(slug);
  if (!article) return {};

  const title = article.seo?.metaTitle || article.title;
  const description = article.seo?.metaDescription || article.excerpt;
  // OG image öncelik: SEO → mainImage → undefined
  const ogImageAsset = article.seo?.ogImage?.asset
    ? article.seo.ogImage
    : article.mainImage?.asset
      ? article.mainImage
      : null;
  const ogImageUrl = ogImageAsset
    ? urlFor(ogImageAsset).width(1200).height(630).url()
    : undefined;

  return {
    title,
    description,
    openGraph: {
      title,
      description: description || undefined,
      type: "article",
      url: `https://sanatinrotasi.com/yazilar/${article.slug.current}`,
      images: ogImageUrl ? [{ url: ogImageUrl, width: 1200, height: 630 }] : undefined,
      publishedTime: article.publishedAt,
      authors: article.author?.name ? [article.author.name] : undefined,
      section: article.category?.title,
      tags: article.tags,
    },
    twitter: {
      card: ogImageUrl ? "summary_large_image" : "summary",
      title,
      description: description || undefined,
      images: ogImageUrl ? [ogImageUrl] : undefined,
    },
    alternates: {
      canonical: `https://sanatinrotasi.com/yazilar/${article.slug.current}`,
    },
  };
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = await findArticleBySlug(slug);

  if (!article) notFound();

  // Fetch comments + related articles + current user in parallel
  const [comments, relatedArticles, user] = await Promise.all([
    client
      .fetch(COMMENTS_BY_ARTICLE_QUERY, { articleId: article._id })
      .catch(() => []),
    article.category?._id || article.category?.slug
      ? client
          .fetch(
            RELATED_ARTICLES_QUERY,
            {
              categoryId: article.category._id,
              articleId: article._id,
            },
            { next: { revalidate: 300 } },
          )
          .catch(() => [])
      : Promise.resolve([]),
    currentUser().catch(() => null),
  ]);

  const currentUserInfo = user
    ? {
        id: user.id,
        name:
          [user.firstName, user.lastName].filter(Boolean).join(" ") ||
          user.username ||
          "Anonim",
        image: user.imageUrl || undefined,
      }
    : null;

  const isAdmin = isAdminUser(user);

  const date = article.publishedAt
    ? new Date(article.publishedAt).toLocaleDateString("tr-TR", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "";

  const readMinutes = readingTimeMinutes(article.body);

  return (
    <article className="max-w-4xl mx-auto px-6 md:px-12 py-12">
      {/* Header */}
      <header className="mb-10 animate-fade-up">
        {article.category?.title && (
          article.category.slug?.current ? (
            <Link
              href={`/kategori/${article.category.slug.current}`}
              className="font-sans text-[0.65rem] uppercase tracking-[0.2em] text-accent link-underline"
            >
              {article.category.title}
            </Link>
          ) : (
            <span className="font-sans text-[0.65rem] uppercase tracking-[0.2em] text-accent">
              {article.category.title}
            </span>
          )
        )}
        <h1 className="font-display text-3xl md:text-5xl font-bold text-ink mt-3 leading-tight">
          {article.title}
        </h1>
        <div className="flex items-center gap-4 mt-6 font-sans text-[0.7rem] uppercase tracking-[0.15em] text-warm-gray">
          {article.author && (
            <div className="flex items-center gap-2">
              {article.author.image && (
                <Image
                  src={urlFor(article.author.image).width(40).height(40).url()}
                  alt={article.author.name}
                  width={20}
                  height={20}
                  className="rounded-full"
                />
              )}
              <span>{article.author.name}</span>
            </div>
          )}
          {date && (
            <>
              <span>·</span>
              <span>{date}</span>
            </>
          )}
          <span>·</span>
          <span>{readMinutes} dk okuma</span>
          <span className="ml-auto">
            <FavoriteButton
              articleId={article._id}
              isSignedIn={!!user}
            />
          </span>
        </div>
      </header>

      {/* Main image — fallback to SEO ogImage if no mainImage */}
      {(() => {
        const heroImage = article.mainImage?.asset
          ? article.mainImage
          : article.seo?.ogImage?.asset
            ? article.seo.ogImage
            : null;
        if (!heroImage) return null;
        const heroUrl = urlFor(heroImage).width(1600).height(900).fit("max").url();
        if (!heroUrl) return null;
        return (
          <div className="relative mb-10 animate-fade-up stagger-1">
            <Image
              src={heroUrl}
              alt={heroImage.alt || article.title}
              width={1600}
              height={900}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1200px"
              className="w-full h-auto"
              priority
            />
          </div>
        );
      })()}

      {/* Body */}
      <div className="portable-text animate-fade-up stagger-2">
        {article.body && <PortableRenderer value={article.body} />}
      </div>

      {/* Sosyal Medya Görseli — yazının sonunda.
          Sadece Ana Görsel VARSA ve SEO görseli ondan farklıysa göster;
          Ana Görsel yoksa SEO zaten hero'da gösterildi (duplicate olmasın). */}
      {article.mainImage?.asset &&
        article.seo?.ogImage?.asset &&
        article.seo.ogImage.asset._ref !== article.mainImage.asset._ref && (
          <figure className="mt-12 pt-8 border-t border-ink/10">
            <Image
              src={urlFor(article.seo.ogImage).width(1600).fit("max").auto("format").url()}
              alt={article.title}
              width={1600}
              height={840}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1200px"
              className="w-full h-auto"
            />
          </figure>
        )}

      {/* Tags */}
      {article.tags && article.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-10 pt-6 border-t border-ink/10">
          {article.tags.map((tag: string) => (
            <span
              key={tag}
              className="font-sans text-[0.6rem] uppercase tracking-[0.15em] px-3 py-1 border border-ink/10 text-warm-gray"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Author bio */}
      {article.author && (
        <div className="mt-10 pt-8 border-t-2 border-ink flex gap-6 items-start">
          {article.author.image && (
            <Image
              src={urlFor(article.author.image).width(120).height(120).url()}
              alt={article.author.name}
              width={60}
              height={60}
              className="rounded-full grayscale-[15%]"
            />
          )}
          <div>
            <h3 className="font-display text-lg font-bold text-ink">{article.author.name}</h3>
            {article.author.role && (
              <p className="font-sans text-[0.65rem] uppercase tracking-[0.2em] text-accent mt-0.5">
                {article.author.role}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Related articles */}
      {Array.isArray(relatedArticles) && relatedArticles.length > 0 && (
        <section className="mt-16 pt-10 border-t-2 border-ink">
          <h2 className="font-display text-xl md:text-2xl font-bold text-ink mb-6">
            İlgili Yazılar
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {relatedArticles.map((r: any) => (
              <ArticleCard key={r._id} article={r} />
            ))}
          </div>
        </section>
      )}

      {/* Comments */}
      <CommentsSection
        articleId={article._id}
        articleSlug={article.slug.current}
        initialComments={comments || []}
        currentUser={currentUserInfo}
        isAdmin={isAdmin}
      />

      {/* Schema.org JSON-LD — Google için yapısal veri */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            // SEO metaTitle varsa onu öncelikle kullan (Ela özellikle seçmişse)
            headline: article.seo?.metaTitle || article.title,
            description:
              article.seo?.metaDescription || article.excerpt,
            datePublished: article.publishedAt,
            dateModified: article._updatedAt || article.publishedAt,
            author: article.author?.name
              ? { "@type": "Person", name: article.author.name }
              : undefined,
            publisher: {
              "@type": "Organization",
              name: "Sanatın Rotası",
              url: "https://sanatinrotasi.com",
            },
            image: article.seo?.ogImage?.asset
              ? urlFor(article.seo.ogImage).width(1200).height(630).url()
              : article.mainImage?.asset
                ? urlFor(article.mainImage).width(1200).height(630).url()
                : undefined,
            mainEntityOfPage: {
              "@type": "WebPage",
              "@id": `https://sanatinrotasi.com/yazilar/${article.slug.current}`,
            },
            articleSection: article.category?.title,
            keywords: article.tags?.join(", "),
            wordCount: undefined,
          }),
        }}
      />
    </article>
  );
}
