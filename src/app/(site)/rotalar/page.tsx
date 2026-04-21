import { client } from "@/sanity/client";
import { ROUTES_QUERY } from "@/sanity/queries";
import { getSiteSettings } from "@/sanity/lib/settings";
import RouteCard from "@/components/shared/RouteCard";
import SectionLabel from "@/components/shared/SectionLabel";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sanat Rotaları",
  description: "Küratörlü tematik sanat rotaları — şehirlerin sanat damarlarını keşfedin.",
};

export const revalidate = 60;

export default async function RotalarPage() {
  const [routes, settings] = await Promise.all([
    client.fetch(ROUTES_QUERY),
    getSiteSettings(),
  ]);
  const emptyText =
    settings?.emptyRoutesText || "Henüz yayınlanmış rota bulunmuyor.";

  return (
    <div className="max-w-7xl mx-auto px-6 md:px-12 py-12">
      <header className="mb-10 animate-fade-up">
        <SectionLabel label="Rotalar" className="mb-3 block" />
        <h1 className="font-display text-4xl md:text-5xl font-bold text-ink">
          Sanat <span className="italic text-accent">Rotaları</span>
        </h1>
        <p className="font-serif text-lg text-soft-black/70 mt-3 max-w-2xl">
          Küratörlü tematik rotalarla şehirlerin sanat damarlarını keşfedin. Her
          rota, özenle seçilmiş duraklar ve hikayelerle dolu bir yolculuk.
        </p>
      </header>

      {routes && routes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-fade-up stagger-2">
          {routes.map((route: any) => (
            <RouteCard key={route._id} route={route} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <p className="font-serif text-xl text-warm-gray italic">
            {emptyText}
          </p>
          <p className="font-sans text-sm text-warm-gray mt-2">
            İlk sanat rotaları çok yakında burada olacak.
          </p>
        </div>
      )}
    </div>
  );
}
