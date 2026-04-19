import Link from "next/link";

interface FooterProps {
  footerText?: string;
  instagramUrl?: string;
  youtubeUrl?: string;
  pinterestUrl?: string;
  udemyUrl?: string;
  twitterUrl?: string;
}

export default function Footer({
  footerText = `© ${new Date().getFullYear()} Sanatın Rotası — Tüm hakları saklıdır.`,
  instagramUrl,
  youtubeUrl,
  pinterestUrl,
  udemyUrl,
  twitterUrl,
}: FooterProps) {
  const visibleLinks: { label: string; url?: string }[] = [
    { label: "Instagram", url: instagramUrl },
    { label: "YouTube", url: youtubeUrl },
    { label: "Pinterest", url: pinterestUrl },
    { label: "Udemy", url: udemyUrl },
    { label: "X", url: twitterUrl },
  ];

  return (
    <footer className="border-t-2 border-ink mt-auto" role="contentinfo">
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
          <div className="flex flex-wrap gap-4 md:gap-6 justify-center">
            {visibleLinks.map((link) => {
              const isExternal = !!link.url;
              const href = link.url || "/";
              return (
                <a
                  key={link.label}
                  href={href}
                  target={isExternal ? "_blank" : undefined}
                  rel={isExternal ? "noopener noreferrer" : undefined}
                  aria-label={
                    isExternal
                      ? `${link.label} (yeni sekmede açılır)`
                      : link.label
                  }
                  className="font-sans text-xs uppercase tracking-[0.2em] text-soft-black hover:text-accent transition-colors link-underline"
                >
                  {link.label}
                </a>
              );
            })}
          </div>
          <div className="font-sans text-xs text-warm-gray text-center md:text-right">
            {footerText}
          </div>
        </div>
        <nav
          aria-label="Alt sayfa bağlantıları"
          className="flex flex-wrap justify-center gap-6 pt-4 border-t border-ink/10"
        >
          <Link
            href="/ara"
            className="font-sans text-[0.6rem] uppercase tracking-[0.15em] text-warm-gray hover:text-accent transition-colors link-underline"
          >
            Ara
          </Link>
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
