"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  articleId: string;
  isSignedIn: boolean;
  initialIsFavorite?: boolean;
}

export default function FavoriteButton({
  articleId,
  isSignedIn,
  initialIsFavorite = false,
}: Props) {
  const [isFav, setIsFav] = useState(initialIsFavorite);
  const [loading, setLoading] = useState(false);
  // Signed-in değilse doğrudan hydrated=true başlat — effect içinde setState yok.
  const [hydrated, setHydrated] = useState(!isSignedIn);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Client mount sonrası favorileri bir kez çek (sadece signed-in'de)
  useEffect(() => {
    if (!isSignedIn) return;
    fetch("/api/favorites")
      .then((r) => (r.ok ? r.json() : { favorites: [] }))
      .then((d: { favorites?: string[] }) => {
        if (!mountedRef.current) return;
        setIsFav((d.favorites || []).includes(articleId));
        setHydrated(true);
      })
      .catch(() => {
        if (mountedRef.current) setHydrated(true);
      });
  }, [articleId, isSignedIn]);

  async function toggle() {
    if (!isSignedIn) {
      window.location.href = "/giris";
      return;
    }
    if (loading) return;
    setLoading(true);
    const action = isFav ? "remove" : "add";
    // Optimistic
    setIsFav(!isFav);
    try {
      const res = await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ articleId, action }),
      });
      if (!res.ok) {
        // revert
        setIsFav(isFav);
      }
    } catch {
      setIsFav(isFav);
    }
    setLoading(false);
  }

  if (!hydrated) {
    return (
      <button
        disabled
        aria-label="Kaydet"
        className="font-sans text-[0.65rem] uppercase tracking-[0.2em] text-warm-gray inline-flex items-center gap-1.5"
      >
        <span>☆</span>
        <span>Kaydet</span>
      </button>
    );
  }

  return (
    <button
      onClick={toggle}
      aria-label={isFav ? "Favorilerden kaldır" : "Favorilere ekle"}
      aria-pressed={isFav}
      disabled={loading}
      className="font-sans text-[0.65rem] uppercase tracking-[0.2em] text-warm-gray hover:text-accent transition-colors inline-flex items-center gap-1.5 disabled:opacity-60"
    >
      <span className={isFav ? "text-accent" : ""}>{isFav ? "★" : "☆"}</span>
      <span>{isFav ? "Kaydedildi" : "Kaydet"}</span>
    </button>
  );
}
