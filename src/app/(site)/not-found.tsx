import Link from "next/link";

export default function NotFound() {
  return (
    <div className="max-w-3xl mx-auto px-6 md:px-12 py-20 text-center">
      <h1 className="font-display text-6xl font-black text-ink mb-4">404</h1>
      <p className="font-serif text-xl text-soft-black/70 mb-8">
        Aradaginiz sayfa bulunamadi.
      </p>
      <Link
        href="/"
        className="inline-block px-8 py-3 bg-ink text-cream font-sans text-xs uppercase tracking-[0.2em] border border-ink hover:bg-accent hover:border-accent transition-colors"
      >
        Ana Sayfaya Don
      </Link>
    </div>
  );
}
