import type { Metadata } from "next";
import { PortableText } from "@portabletext/react";
import { client } from "@/sanity/client";
import { PAGE_BY_SLUG_QUERY } from "@/sanity/queries";
import ContactForm from "./ContactForm";
import SectionLabel from "@/components/shared/SectionLabel";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const page = await client.fetch(PAGE_BY_SLUG_QUERY, { slug: "iletisim" });
  return {
    title: page?.seo?.metaTitle || page?.title || "İletişim",
    description:
      page?.seo?.metaDescription ||
      page?.subtitle ||
      "Sanatın Rotası ile iletişime geçin — iş birliği, öneri veya sorularınız için bize yazın.",
  };
}

export default async function IletisimPage() {
  const page = await client.fetch(PAGE_BY_SLUG_QUERY, { slug: "iletisim" });

  return (
    <div className="max-w-3xl mx-auto px-6 md:px-12 py-12">
      <header className="mb-10 animate-fade-up">
        <SectionLabel label={page?.sectionLabel || "İletişim"} className="mb-3 block" />
        <h1 className="font-display text-4xl md:text-5xl font-bold text-ink">
          {page?.headingPrefix || "Bize"}{" "}
          <span className="italic text-accent">
            {page?.headingHighlight || "Ulaşın"}
          </span>
        </h1>
        {page?.subtitle && (
          <p className="font-serif text-lg text-soft-black/70 mt-3">{page.subtitle}</p>
        )}
      </header>

      {page?.body && (
        <div className="portable-text mb-10 animate-fade-up stagger-1">
          <PortableText value={page.body} />
        </div>
      )}

      <ContactForm />
    </div>
  );
}
