"use client";

import dynamic from "next/dynamic";

// Leaflet window kullandığı için ssr:false — Client Component içinden import edilir.
const RouteMap = dynamic(() => import("./RouteMap"), {
  ssr: false,
  loading: () => (
    <div className="my-8 w-full h-[400px] md:h-[480px] border-2 border-ink/10 flex items-center justify-center font-sans text-[0.7rem] uppercase tracking-[0.2em] text-warm-gray">
      Harita yükleniyor…
    </div>
  ),
});

type Stop = {
  name: string;
  description?: string;
  location?: { lat: number; lng: number };
};

interface Props {
  stops: Stop[];
  city?: string;
}

export default function RouteMapClient(props: Props) {
  return <RouteMap {...props} />;
}
