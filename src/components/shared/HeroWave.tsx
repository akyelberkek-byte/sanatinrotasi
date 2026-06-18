/**
 * Hero altında ince akan dalga — "rota"nın görsel metaforu (nehir/yol).
 * Çift katman:
 *  - Ön plan: kalın çizgi, hızlı akış (~12s)
 *  - Arka plan: ince çizgi, ters yönde yavaş akış (~22s)
 * Sonuç: paralaks derinliği, dingin akış hissi.
 *
 * SVG accent renginde (#9A1F25). Pointer events kapalı — tıklama engellenmez.
 * Decorative (aria-hidden) → ekran okuyucular atlar.
 */

export default function HeroWave() {
  return (
    <div
      className="relative w-full h-10 md:h-12 my-4 md:my-6 overflow-hidden pointer-events-none"
      aria-hidden="true"
    >
      {/* Ön plan dalgası — daha belirgin, hızlı */}
      <svg
        className="absolute inset-0 w-[200%] h-full text-accent hero-wave-fast"
        viewBox="0 0 1200 60"
        preserveAspectRatio="none"
        fill="none"
      >
        <path
          d="M0,30 Q75,5 150,30 T300,30 T450,30 T600,30 T750,30 T900,30 T1050,30 T1200,30"
          stroke="currentColor"
          strokeWidth="1.5"
          opacity="0.55"
          strokeLinecap="round"
        />
      </svg>

      {/* Arka plan dalgası — ince, yavaş, ters yön */}
      <svg
        className="absolute inset-0 w-[200%] h-full text-accent hero-wave-slow"
        viewBox="0 0 1200 60"
        preserveAspectRatio="none"
        fill="none"
      >
        <path
          d="M0,34 Q75,58 150,34 T300,34 T450,34 T600,34 T750,34 T900,34 T1050,34 T1200,34"
          stroke="currentColor"
          strokeWidth="1"
          opacity="0.22"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}
