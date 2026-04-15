import Link from "next/link";
import Image from "next/image";
import { urlFor } from "@/sanity/image";

interface RouteCardProps {
  route: {
    title: string;
    slug: { current: string };
    subtitle?: string;
    city?: string;
    mainImage?: any;
    duration?: string;
    difficulty?: string;
    stopCount?: number;
  };
}

const DIFFICULTY_LABELS: Record<string, string> = {
  kolay: "Kolay",
  orta: "Orta",
  uzun: "Uzun",
};

export default function RouteCard({ route }: RouteCardProps) {
  return (
    <Link
      href={`/rotalar/${route.slug.current}`}
      className="group block border-t-2 border-ink"
    >
      {route.mainImage && (
        <div className="relative overflow-hidden aspect-[3/2] mt-4">
          <Image
            src={urlFor(route.mainImage).width(600).height(400).url()}
            alt={route.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/40 to-transparent" />
          {route.city && (
            <span className="absolute bottom-3 left-3 font-sans text-[0.6rem] uppercase tracking-[0.2em] text-cream/90">
              {route.city}
            </span>
          )}
        </div>
      )}
      <div className="pt-3">
        <h3 className="font-display text-xl font-bold text-ink group-hover:text-accent transition-colors">
          {route.title}
        </h3>
        {route.subtitle && (
          <p className="font-serif text-sm text-soft-black/70 italic mt-1">{route.subtitle}</p>
        )}
        <div className="flex items-center gap-3 mt-3 font-sans text-[0.6rem] uppercase tracking-[0.15em] text-warm-gray">
          {route.stopCount != null && <span>{route.stopCount} durak</span>}
          {route.duration && (
            <>
              <span>·</span>
              <span>{route.duration}</span>
            </>
          )}
          {route.difficulty && (
            <>
              <span>·</span>
              <span>{DIFFICULTY_LABELS[route.difficulty] || route.difficulty}</span>
            </>
          )}
        </div>
      </div>
    </Link>
  );
}
