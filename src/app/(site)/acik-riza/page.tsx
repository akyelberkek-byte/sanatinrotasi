import { PortableText } from "@portabletext/react";
import { client } from "@/sanity/client";
import { PAGE_BY_SLUG_QUERY } from "@/sanity/queries";
import SectionLabel from "@/components/shared/SectionLabel";
import type { Metadata } from "next";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const page = await client.fetch(PAGE_BY_SLUG_QUERY, { slug: "acik-riza" });
  return {
    title: page?.seo?.metaTitle || page?.title || "Açık Rıza Onayı",
    description:
      page?.seo?.metaDescription ||
      page?.subtitle ||
      "Sanatın Rotası Açık Rıza Onayı Metni",
  };
}

export default async function AcikRizaPage() {
  const page = await client.fetch(PAGE_BY_SLUG_QUERY, { slug: "acik-riza" });

  const lastUpdatedStr = page?.lastUpdated
    ? new Date(page.lastUpdated).toLocaleDateString("tr-TR", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <div className="max-w-3xl mx-auto px-6 md:px-12 py-12">
      <header className="mb-10 animate-fade-up">
        <SectionLabel label={page?.sectionLabel || "Yasal"} className="mb-3 block" />
        <h1 className="font-display text-3xl md:text-4xl font-bold text-ink">
          {page?.headingPrefix || "Açık Rıza"}{" "}
          {page?.headingHighlight && (
            <span className="italic text-accent">{page.headingHighlight}</span>
          )}
          {!page?.headingPrefix && "Onayı"}
        </h1>
        {lastUpdatedStr && (
          <p className="font-sans text-xs text-warm-gray mt-2">
            Son güncelleme: {lastUpdatedStr}
          </p>
        )}
      </header>

      {page?.body ? (
        <div className="portable-text animate-fade-up stagger-1">
          <PortableText value={page.body} />
        </div>
      ) : (
        <p className="font-serif text-base text-warm-gray italic">
          Bu sayfanın içeriği henüz eklenmedi. Sanity Studio&apos;dan düzenleyebilirsiniz.
        </p>
      )}
    </div>
  );
}
