"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

type Stop = {
  name: string;
  description?: string;
  location?: { lat: number; lng: number };
};

interface Props {
  stops: Stop[];
  city?: string;
}

/**
 * Rota haritası — Leaflet (vanilla, react-leaflet değil) ile çizilir.
 * - OpenStreetMap tiles (ücretsiz, hesap gerektirmez)
 * - Carto "voyager-no-labels" / "positron" gibi minimal stiller de seçilebilir
 * - Duraklar arası polyline → rota görselleştirmesi
 * - Marker'lar custom: küçük accent renkli numaralı daireler
 */

// Custom numbered marker (HTML divIcon)
function numberedIcon(num: number): L.DivIcon {
  return L.divIcon({
    html: `
      <div class="sr-marker" data-num="${num}">
        ${num}
      </div>
    `,
    className: "sr-marker-wrapper",
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  });
}

export default function RouteMap({ stops, city }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    // Sadece geçerli location'a sahip durakları çiz
    const validStops = stops.filter(
      (s): s is Stop & { location: { lat: number; lng: number } } =>
        !!s.location && typeof s.location.lat === "number" && typeof s.location.lng === "number",
    );
    if (validStops.length === 0) return;

    // Map oluştur (zaten varsa temizle)
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    const bounds = L.latLngBounds(
      validStops.map((s) => L.latLng(s.location.lat, s.location.lng)),
    );

    const map = L.map(containerRef.current, {
      scrollWheelZoom: false, // sayfa scroll'unu engelleyecek davranışı kapat
      attributionControl: true,
      zoomControl: true,
    });
    mapRef.current = map;

    // Minimal tile — CartoCDN Positron (gri/beyaz, editorial)
    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
      {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: "abcd",
        maxZoom: 19,
      },
    ).addTo(map);

    // Marker'lar
    validStops.forEach((s, i) => {
      const m = L.marker([s.location.lat, s.location.lng], {
        icon: numberedIcon(i + 1),
      }).addTo(map);
      const html = `
        <div style="font-family: var(--font-urbane), Urbanist, sans-serif; max-width:220px;">
          <div style="font-size:0.6rem; text-transform:uppercase; letter-spacing:0.15em; color:#9A1F25; margin-bottom:4px;">Durak ${i + 1}</div>
          <div style="font-weight:700; font-size:1rem; line-height:1.2; color:#1a1a18;">${s.name}</div>
          ${s.description ? `<div style="font-size:0.85rem; color:#2d2b28; margin-top:6px; line-height:1.4;">${s.description.slice(0, 200)}</div>` : ""}
        </div>
      `;
      m.bindPopup(html);
    });

    // Duraklar arası rota çizgisi
    if (validStops.length > 1) {
      L.polyline(
        validStops.map((s) => [s.location.lat, s.location.lng]),
        {
          color: "#9A1F25",
          weight: 2.5,
          opacity: 0.7,
          dashArray: "6 4",
          lineCap: "round",
        },
      ).addTo(map);
    }

    // Tüm noktaları kapsayacak şekilde fit + padding
    if (validStops.length === 1) {
      map.setView(bounds.getCenter(), 14);
    } else {
      map.fitBounds(bounds, { padding: [40, 40] });
    }

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [stops]);

  // Konum bilgisi olmayan durak varsa kullanıcıya bildir
  const validCount = stops.filter((s) => s.location).length;
  if (validCount === 0) return null;

  return (
    <div className="my-8 animate-fade-up">
      <div className="flex items-baseline justify-between mb-3">
        <span className="font-sans text-[0.65rem] uppercase tracking-[0.25em] text-accent">
          Rota Haritası
        </span>
        {city && (
          <span className="font-sans text-[0.65rem] uppercase tracking-[0.2em] text-warm-gray">
            {city}
          </span>
        )}
      </div>
      <div
        ref={containerRef}
        className="w-full h-[400px] md:h-[480px] border-2 border-ink/15 z-0"
      />
      {validCount < stops.length && (
        <p className="font-sans text-[0.65rem] text-warm-gray mt-2">
          Not: {stops.length - validCount} durağın konumu Sanity'de tanımlanmamış,
          haritada görünmüyor.
        </p>
      )}
    </div>
  );
}
