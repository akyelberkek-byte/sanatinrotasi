import Link from "next/link";
import Image from "next/image";
import { urlFor } from "@/sanity/image";

const EVENT_TYPE_LABELS: Record<string, string> = {
  atolye: "Atölye",
  soylesi: "Söyleşi",
  sergi: "Sergi",
  performans: "Performans",
  konser: "Konser",
  festival: "Festival",
  diger: "Diğer",
};

interface EventCardProps {
  event: {
    title: string;
    slug: { current: string };
    eventType: string;
    date: string;
    location?: { name?: string; city?: string };
    mainImage?: any;
    price?: { isFree?: boolean; amount?: number };
    featured?: boolean;
  };
}

export default function EventCard({ event }: EventCardProps) {
  const dateObj = new Date(event.date);
  const day = dateObj.getDate();
  const month = dateObj.toLocaleDateString("tr-TR", { month: "short" }).toUpperCase();

  return (
    <Link
      href={`/etkinlikler/${event.slug.current}`}
      className="group block border border-ink/10 hover:border-accent/30 transition-colors"
    >
      {event.mainImage && (
        <div className="relative overflow-hidden aspect-[16/9]">
          <Image
            src={urlFor(event.mainImage).width(600).height(340).url()}
            alt={event.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute top-3 right-3 bg-cream/90 px-3 py-2 text-center">
            <div className="font-display text-2xl font-bold text-ink leading-none">{day}</div>
            <div className="font-sans text-[0.55rem] uppercase tracking-[0.2em] text-warm-gray">
              {month}
            </div>
          </div>
        </div>
      )}
      <div className="p-4">
        <span className="font-sans text-[0.6rem] uppercase tracking-[0.2em] text-accent">
          {EVENT_TYPE_LABELS[event.eventType] || event.eventType}
        </span>
        <h3 className="font-display text-lg font-bold text-ink mt-1 group-hover:text-accent transition-colors">
          {event.title}
        </h3>
        <div className="flex items-center gap-2 mt-2 font-sans text-[0.65rem] text-warm-gray">
          {event.location?.name && <span>{event.location.name}</span>}
          {event.location?.name && event.location?.city && <span>·</span>}
          {event.location?.city && <span>{event.location.city}</span>}
        </div>
        {event.price && (
          <div className="mt-2 font-sans text-xs text-accent font-medium">
            {event.price.isFree ? "Ücretsiz" : `${event.price.amount} TL`}
          </div>
        )}
      </div>
    </Link>
  );
}
