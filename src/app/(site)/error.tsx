"use client";

export default function SiteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="max-w-3xl mx-auto px-6 md:px-12 py-20 text-center">
      <h1 className="font-display text-4xl font-bold text-ink mb-4">
        Bir hata olustu
      </h1>
      <p className="font-serif text-lg text-soft-black/70 mb-8">
        Sayfa yuklenirken beklenmedik bir hata meydana geldi.
      </p>
      <button
        onClick={reset}
        className="px-8 py-3 bg-ink text-cream font-sans text-xs uppercase tracking-[0.2em] border border-ink hover:bg-accent hover:border-accent transition-colors"
      >
        Tekrar Dene
      </button>
    </div>
  );
}
