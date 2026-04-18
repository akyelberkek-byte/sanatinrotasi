import { findArticleBySlug } from "@/sanity/lib/findArticle";
import { urlFor } from "@/sanity/image";
import { PortableText } from "@portabletext/react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import SectionLabel from "@/components/shared/SectionLabel";
import type { Metadata } from "next";

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

const portableTextComponents = {
  types: {
    image: ({ value }: any) => {
      if (!value?.asset) return null;
      return (
        <figure className="my-8">
          <Image
            src={urlFor(value).width(1200).url()}
            alt={value.caption || ""}
            width={1200}
            height={675}
            className="w-full"
          />
          {value.caption && (
            <figcaption className="font-sans text-xs text-warm-gray mt-2 text-center">
              {value.caption}
              {value.attribution && <span> — {value.attribution}</span>}
            </figcaption>
          )}
        </figure>
      );
    },
    youtube: ({ value }: any) => {
      if (!value?.url) return null;
      const videoId = value.url.match(
        /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]+)/
      )?.[1];
      if (!videoId) return null;
      return (
        <figure className="my-8">
          <div className="relative aspect-video">
            <iframe
              src={`https://www.youtube.com/embed/${videoId}`}
              title={value.caption || "YouTube video"}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              loading="lazy"
              className="absolute inset-0 w-full h-full"
            />
          </div>
          {value.caption && (
            <figcaption className="font-sans text-xs text-warm-gray mt-2 text-center">
              {value.caption}
            </figcaption>
          )}
        </figure>
      );
    },
  },
};

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = await findArticleBySlug(slug);

  if (!article) notFound();

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
        {article.category && (
          <Link
            href={`/kategori/${article.category.slug.current}`}
            className="font-sans text-[0.65rem] uppercase tracking-[0.2em] text-accent link-underline"
          >
            {article.category.title}
          </Link>
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

      {/* Main image */}
      {article.mainImage && (
        <div className="relative mb-10 animate-fade-up stagger-1">
          <Image
            src={urlFor(article.mainImage).width(1200).height(675).url()}
            alt={article.mainImage.alt || article.title}
            width={1200}
            height={675}
            className="w-full"
            priority
          />
        </div>
      )}

      {/* Body */}
      <div className="portable-text animate-fade-up stagger-2">
        {article.body && (
          <PortableText value={article.body} components={portableTextComponents} />
        )}
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
    </article>
  );
}
