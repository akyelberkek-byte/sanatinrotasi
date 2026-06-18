"use client";

import { useEffect } from "react";

/**
 * Tıklama efekti — logodaki yatay çizgi motifinin sanatsal yorumu.
 * Her tıklamada tıklanan noktadan 3 küçük çizgi farklı yönlere fırlar,
 * accent rengiyle (logo kırmızısı), 500ms içinde fade-out.
 *
 * Filtreler:
 * - Input/textarea/select'te tetiklenmez (form deneyimini bozmasın)
 * - Sadece primary (sol) tıklama
 * - Modifier tuş basılıysa atla (cmd-click yeni sekme açar, vs.)
 * - Mobile touch desteklenir (pointerdown event)
 */
export default function ClickEffect() {
  useEffect(() => {
    function handlePointerDown(e: PointerEvent) {
      // Sadece primary buton
      if (e.button !== 0) return;
      // Modifier tuş varsa atla
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      const target = e.target as HTMLElement | null;
      if (!target) return;

      // Form input'larında tetikleme
      const tag = target.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      // contenteditable'larda da atla
      if (target.closest("[contenteditable='true']")) return;

      const x = e.clientX;
      const y = e.clientY;

      // 3 çizgi, ~120° aralıkla farklı yönlere fırlasın (logo motifi)
      // Her tıklamada hafif rastgelelik → tekrarlayıcı olmasın
      const baseAngle = Math.random() * 360;
      for (let i = 0; i < 3; i++) {
        const dash = document.createElement("span");
        dash.className = "click-dash";
        const angle = baseAngle + i * 120 + (Math.random() * 20 - 10);
        dash.style.left = `${x}px`;
        dash.style.top = `${y}px`;
        dash.style.setProperty("--angle", `${angle}deg`);
        // Animation tamamlanır tamamlanmaz DOM'dan kaldır
        dash.addEventListener("animationend", () => dash.remove(), { once: true });
        document.body.appendChild(dash);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  return null;
}
