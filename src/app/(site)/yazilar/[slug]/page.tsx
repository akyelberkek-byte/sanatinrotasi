import { findArticleBySlug } from "@/sanity/lib/findArticle";
import { urlFor } from "@/sanity/image";
import { client } from "@/sanity/client";
import { COMMENTS_BY_ARTICLE_QUERY } from "@/sanity/queries";
import { isAdminEmail } from "@/lib/admin";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import PortableRenderer from "@/components/shared/PortableRenderer";
import CommentsSection from "@/components/shared/CommentsSection";
import { currentUser } from "@clerk/nextjs/server";

export const revalidate = 60;

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = await findArticleBySlug(slug);
  if (!article) return {};
  return {
    title: article.seo?.metaTitle || article.title,
    description: article.seo?.metaDescription || article.excerpt,
  };
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = await findArticleBySlug(slug);

  if (!article) notFound();

  // Fetch comments for this article (in parallel with Clerk user lookup)
  const [comments, user] = await Promise.all([
    client
      .fetch(COMMENTS_BY_ARTICLE_QUERY, { articleId: article._id })
      .catch(() => []),
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

  const isAdmin = isAdminEmail(user?.emailAddresses?.[0]?.emailAddress);

  const date = article.publishedAt
    ? new Date(article.publishedAt).toLocaleDateString("tr-TR", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "";

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
              className="w-full h-auto"
              priority
              unoptimized
            />
          </div>
        );
      })()}

      {/* Body */}
      <div className="portable-text animate-fade-up stagger-2">
        {article.body && <PortableRenderer value={article.body} />}
      </div>

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

      {/* Comments */}
      <CommentsSection
        articleId={article._id}
        articleSlug={article.slug.current}
        initialComments={comments || []}
        currentUser={currentUserInfo}
        isAdmin={isAdmin}
      />
    </article>
  );
}
