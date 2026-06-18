"use client";

import { useEffect, useState } from "react";

type Heading = { id: string; text: string; level: number };

/**
 * Sticky içerik tablosu — yazı içindeki H2/H3 başlıklarını dinamik bulur,
 * sol kenarda sticky liste olarak gösterir.
 *
 * Mobile'da: gizli (sayfa zaten dar)
 * Desktop (lg+): sol sticky panel
 * Aktif başlık IntersectionObserver ile vurgulanır.
 *
 * Kısa yazılarda (<2 H2) hiç render edilmez.
 */
export default function StickyTOC({ contentSelector }: { contentSelector: string }) {
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  // 1) Sayfadaki h2/h3'leri bul, id ata, listeye al
  useEffect(() => {
    const root = document.querySelector(contentSelector);
    if (!root) return;

    const els = Array.from(root.querySelectorAll("h2, h3")) as HTMLElement[];
    const items: Heading[] = els.map((el, i) => {
      if (!el.id) {
        const text = el.textContent || "";
        el.id =
          text
            .toLowerCase()
            .replace(/[^a-z0-9çğıöşü\s-]/g, "")
            .replace(/\s+/g, "-")
            .slice(0, 60) || `heading-${i}`;
      }
      return {
        id: el.id,
        text: el.textContent || "",
        level: el.tagName === "H2" ? 2 : 3,
      };
    });
    setHeadings(items);

    // 2) IntersectionObserver — aktif başlığı izle
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: "-15% 0px -70% 0px" },
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [contentSelector]);

  if (headings.length < 2) return null;

  return (
    <nav
      aria-label="İçindekiler"
      className="hidden lg:block fixed left-6 top-[140px] w-[200px] z-30"
    >
      <p className="font-sans text-[0.55rem] uppercase tracking-[0.25em] text-warm-gray mb-3">
        İçindekiler
      </p>
      <ul className="space-y-1.5 max-h-[calc(100vh-200px)] overflow-y-auto pr-2">
        {headings.map((h) => (
          <li key={h.id} className={h.level === 3 ? "pl-3" : ""}>
            <a
              href={`#${h.id}`}
              className={`block font-sans text-[0.72rem] leading-snug py-0.5 border-l-2 pl-2 transition-colors hover:text-accent ${
                activeId === h.id
                  ? "border-accent text-accent font-semibold"
                  : "border-ink/15 text-warm-gray"
              }`}
            >
              {h.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
