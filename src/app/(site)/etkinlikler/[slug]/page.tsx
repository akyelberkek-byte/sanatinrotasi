import { client } from "@/sanity/client";
import { EVENT_BY_SLUG_QUERY } from "@/sanity/queries";
import { urlFor } from "@/sanity/image";
import Image from "next/image";
import { notFound } from "next/navigation";
import SectionLabel from "@/components/shared/SectionLabel";
import PortableRenderer from "@/components/shared/PortableRenderer";
import type { Metadata } from "next";

export const revalidate = 60;

const EVENT_TYPE_LABELS: Record<string, string> = {
  atolye: "Atölye",
  soylesi: "Söyleşi",
  sergi: "Sergi",
  performans: "Performans",
  konser: "Konser",
  festival: "Festival",
  diger: "Diğer",
};

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const event = await client.fetch(EVENT_BY_SLUG_QUERY, { slug });
  if (!event) return {};
  return {
    title: event.seo?.metaTitle || event.title,
    description: event.seo?.metaDescription || `${EVENT_TYPE_LABELS[event.eventType] || ""} — ${event.title}`,
  };
}

export default async function EventPage({ params }: Props) {
  const { slug } = await params;
  const event = await client.fetch(EVENT_BY_SLUG_QUERY, { slug });
  if (!event) notFound();

  const dateStr = event.date
    ? new Date(event.date).toLocaleDateString("tr-TR", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  return (
    <article className="max-w-4xl mx-auto px-6 md:px-12 py-12">
      <header className="mb-10 animate-fade-up">
        <SectionLabel
          label={EVENT_TYPE_LABELS[event.eventType] || "Etkinlik"}
          className="mb-3 block"
        />
        <h1 className="font-display text-3xl md:text-5xl font-bold text-ink leading-tight">
          {event.title}
        </h1>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <div className="font-sans text-sm text-soft-black">
              <span className="font-medium">Tarih:</span> {dateStr}
            </div>
            {event.location?.name && (
              <div className="font-sans text-sm text-soft-black">
                <span className="font-medium">Mekan:</span> {event.location.name}
                {event.location.address && `, ${event.location.address}`}
              </div>
            )}
            {event.location?.city && (
              <div className="font-sans text-sm text-soft-black">
                <span className="font-medium">Şehir:</span> {event.location.city}
              </div>
            )}
          </div>
          <div className="flex flex-col gap-2 md:items-end">
            {event.price && (
              <div className="font-display text-2xl font-bold text-accent">
                {event.price.isFree ? "Ücretsiz" : `${event.price.amount} TL`}
              </div>
            )}
            {event.externalUrl && (
              <a
                href={event.externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-6 py-3 bg-ink text-cream font-sans text-xs uppercase tracking-[0.2em] hover:bg-accent transition-colors"
              >
                Bilet / Kayıt
              </a>
            )}
          </div>
        </div>
      </header>

      {event.mainImage && (
        <div className="mb-10 animate-fade-up stagger-1">
          <Image
            src={urlFor(event.mainImage).width(1200).height(675).url()}
            alt={event.title}
            width={1200}
            height={675}
            className="w-full"
            priority
          />
        </div>
      )}

      {event.description && (
        <div className="portable-text animate-fade-up stagger-2">
          <PortableRenderer value={event.description} />
        </div>
      )}
    </article>
  );
}
