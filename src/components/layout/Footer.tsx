import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t-2 border-ink mt-auto" role="contentinfo">
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
          <div className="flex gap-6">
            <a
              href="https://instagram.com/sanatinrotasi"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram (yeni sekmede açılır)"
              className="font-sans text-xs uppercase tracking-[0.2em] text-soft-black hover:text-accent transition-colors link-underline"
            >
              Instagram
            </a>
            <a
              href="https://youtube.com/@sanatinrotasi"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="YouTube (yeni sekmede açılır)"
              className="font-sans text-xs uppercase tracking-[0.2em] text-soft-black hover:text-accent transition-colors link-underline"
            >
              YouTube
            </a>
          </div>
          <div className="font-sans text-xs text-warm-gray">
            © {new Date().getFullYear()} Sanatın Rotası — Tüm hakları saklıdır.
          </div>
        </div>
        <nav aria-label="Alt sayfa bağlantıları" className="flex justify-center gap-6 pt-4 border-t border-ink/10">
          <Link
            href="/kvkk"
            className="font-sans text-[0.6rem] uppercase tracking-[0.15em] text-warm-gray hover:text-accent transition-colors link-underline"
          >
            KVKK
          </Link>
          <Link
            href="/acik-riza"
            className="font-sans text-[0.6rem] uppercase tracking-[0.15em] text-warm-gray hover:text-accent transition-colors link-underline"
          >
            Açık Rıza
          </Link>
          <Link
            href="/iletisim"
            className="font-sans text-[0.6rem] uppercase tracking-[0.15em] text-warm-gray hover:text-accent transition-colors link-underline"
          >
            İletişim
          </Link>
        </nav>
      </div>
    </footer>
  );
}
