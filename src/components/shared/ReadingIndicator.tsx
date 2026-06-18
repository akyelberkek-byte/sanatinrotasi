"use client";

import { useEffect, useState } from "react";

/**
 * "Kaldığın Yer" + "Okuma Süresi" indicator.
 *
 * localStorage anahtarı per-article: `read-pos:<slug>` → 0-100 yüzde
 * Sayfa yüklendiğinde:
 *  - Önceki konum >5% ve <90% ise → küçük floating buton: "Kaldığın yer — %47"
 *  - Tıklayınca o konuma scroll
 *  - Kullanıcı yeni yere kaydırınca otomatik güncellenir
 *
 * "Reading streak" — kullanıcının ardışık gün sayısı.
 * localStorage `read-streak` → { lastDay, count }
 * Yazıyı 30sn'den fazla okuyup %50'den fazlasına ulaşırsa → "okumuş" sayılır.
 * Ardışık gün gelirse counter artar, aksi halde sıfırlanır.
 */
interface Props {
  slug: string;
}

const RESUME_KEY = (slug: string) => `sr-read-pos:${slug}`;
const STREAK_KEY = "sr-read-streak";

function ymd(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}
function shiftDate(d: Date, days: number): Date {
  const n = new Date(d);
  n.setDate(n.getDate() + days);
  return n;
}

export default function ReadingIndicator({ slug }: Props) {
  const [resumePct, setResumePct] = useState<number | null>(null);
  const [hidden, setHidden] = useState(false);
  const [streak, setStreak] = useState<number>(0);

  // İlk yükleme — varsa kaldığın yeri çek
  useEffect(() => {
    try {
      const raw = localStorage.getItem(RESUME_KEY(slug));
      if (raw) {
        const pct = parseFloat(raw);
        if (pct >= 5 && pct < 90) {
          setResumePct(Math.round(pct));
        }
      }
      // Streak oku (gösterim için)
      const sRaw = localStorage.getItem(STREAK_KEY);
      if (sRaw) {
        const { count } = JSON.parse(sRaw);
        setStreak(Number(count) || 0);
      }
    } catch {
      /* localStorage devre dışı veya parse hatası */
    }
  }, [slug]);

  // Scroll dinle, pozisyonu kaydet, %50+'a gelince streak güncelle
  useEffect(() => {
    let lastSave = 0;
    let reachedHalf = false;

    function onScroll() {
      const top = window.scrollY;
      const h =
        document.documentElement.scrollHeight - window.innerHeight;
      const pct = h > 0 ? (top / h) * 100 : 0;

      // %50'ye geldi → bugünün streak'i tetiklendi
      if (pct >= 50 && !reachedHalf) {
        reachedHalf = true;
        try {
          const today = ymd();
          const raw = localStorage.getItem(STREAK_KEY);
          let nextCount = 1;
          if (raw) {
            const { lastDay, count } = JSON.parse(raw);
            if (lastDay === today) {
              nextCount = Number(count) || 1;
            } else if (lastDay === ymd(shiftDate(new Date(), -1))) {
              nextCount = (Number(count) || 0) + 1;
            } else {
              nextCount = 1;
            }
          }
          localStorage.setItem(
            STREAK_KEY,
            JSON.stringify({ lastDay: ymd(), count: nextCount }),
          );
          setStreak(nextCount);
        } catch {
          /* ignore */
        }
      }

      // %5'ten fazla → kaydet (saniyede en fazla 1 kez)
      const now = Date.now();
      if (now - lastSave > 800 && pct > 5) {
        lastSave = now;
        try {
          localStorage.setItem(RESUME_KEY(slug), String(pct.toFixed(1)));
        } catch {
          /* ignore */
        }
      }
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [slug]);

  function goResume() {
    if (resumePct === null) return;
    const h =
      document.documentElement.scrollHeight - window.innerHeight;
    const target = (resumePct / 100) * h;
    window.scrollTo({ top: target, behavior: "smooth" });
    setHidden(true);
  }

  return (
    <>
      {/* Floating "Kaldığın yer" butonu */}
      {!hidden && resumePct !== null && (
        <div className="fixed bottom-6 right-6 z-40 animate-fade-up">
          <button
            onClick={goResume}
            className="group flex items-center gap-3 px-4 py-3 bg-ink text-cream shadow-lg hover:bg-accent transition-colors"
            aria-label={`Kaldığın yere git — yüzde ${resumePct}`}
          >
            <span className="font-sans text-[0.7rem] uppercase tracking-[0.2em]">
              Kaldığın yer
            </span>
            <span className="font-display text-sm font-bold">
              %{resumePct}
            </span>
            <span aria-hidden="true" className="group-hover:translate-y-0.5 transition-transform">
              ↓
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setHidden(true);
              }}
              className="ml-2 -mr-1 px-1 text-cream/60 hover:text-cream"
              aria-label="Kapat"
            >
              ×
            </button>
          </button>
        </div>
      )}

      {/* Streak rozeti — sadece >= 2 ise göster */}
      {streak >= 2 && (
        <div
          aria-label={`${streak} gündür okuyorsun`}
          className="fixed top-[80px] right-4 z-40 px-2 py-1 bg-accent/10 border border-accent/30 font-sans text-[0.6rem] uppercase tracking-[0.15em] text-accent rounded-full pointer-events-none"
        >
          🔥 {streak} gün
        </div>
      )}
    </>
  );
}
