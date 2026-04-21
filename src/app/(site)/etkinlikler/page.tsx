import { client } from "@/sanity/client";
import { EVENTS_QUERY } from "@/sanity/queries";
import { getSiteSettings } from "@/sanity/lib/settings";
import EventCard from "@/components/shared/EventCard";
import SectionLabel from "@/components/shared/SectionLabel";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Etkinlikler",
  description: "Sanatın Rotası etkinlikleri — atölye, söyleşi, sergi, performans ve daha fazlası.",
};

export const revalidate = 60;

export default async function EtkinliklerPage() {
  const [events, settings] = await Promise.all([
    client.fetch(EVENTS_QUERY, { limit: 50 }),
    getSiteSettings(),
  ]);
  const emptyText = settings?.emptyEventsText || "Yaklaşan etkinlik bulunmuyor.";

  return (
    <div className="max-w-7xl mx-auto px-6 md:px-12 py-12">
      <header className="mb-10 animate-fade-up">
        <SectionLabel label="Etkinlikler" className="mb-3 block" />
        <h1 className="font-display text-4xl md:text-5xl font-bold text-ink">
          Yaklaşan <span className="italic text-accent">Etkinlikler</span>
        </h1>
        <p className="font-serif text-lg text-soft-black/70 mt-3 max-w-2xl">
          Atölyeler, söyleşiler, sergiler, performanslar — sanatın nabzını tutan
          etkinlikler takvimi.
        </p>
      </header>

      {events && events.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-up stagger-2">
          {events.map((event: any) => (
            <EventCard key={event._id} event={event} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <p className="font-serif text-xl text-warm-gray italic">
            {emptyText}
          </p>
          <p className="font-sans text-sm text-warm-gray mt-2">
            Yeni etkinlikler eklendiğinde burada görünecek.
          </p>
        </div>
      )}
    </div>
  );
}
