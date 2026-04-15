import SectionLabel from "@/components/shared/SectionLabel";
import NewsletterForm from "@/components/shared/NewsletterForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Topluluk",
  description: "Sanatın Rotası topluluğuna katılın — bülten, sosyal medya ve daha fazlası.",
};

export default function ToplulukPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 md:px-12 py-12">
      <header className="mb-12 animate-fade-up">
        <SectionLabel label="Topluluk" className="mb-3 block" />
        <h1 className="font-display text-4xl md:text-5xl font-bold text-ink">
          Rotaya <span className="italic text-accent">Katıl</span>
        </h1>
        <p className="font-serif text-lg text-soft-black/70 mt-3 max-w-2xl">
          Sanat severlerle buluş, yeni içeriklerden haberdar ol, etkinliklere katıl.
        </p>
      </header>

      {/* Newsletter */}
      <section className="mb-16 p-8 md:p-12 border-2 border-ink animate-fade-up stagger-1">
        <h2 className="font-display text-2xl font-bold text-ink mb-2 text-center">
          Bülten
        </h2>
        <p className="font-serif text-base text-soft-black/70 text-center mb-8">
          Yeni yazılar, etkinlikler ve rotalar hakkında ilk sen haberdar ol.
        </p>
        <NewsletterForm />
      </section>

      {/* Social */}
      <section className="mb-16 animate-fade-up stagger-2">
        <SectionLabel label="Sosyal Medya" className="mb-6 block" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <a
            href="https://instagram.com/sanatinrotasi"
            target="_blank"
            rel="noopener noreferrer"
            className="block p-8 border border-ink/10 hover:border-accent/30 transition-colors group"
          >
            <h3 className="font-display text-xl font-bold text-ink group-hover:text-accent transition-colors">
              Instagram
            </h3>
            <p className="font-sans text-[0.7rem] uppercase tracking-[0.15em] text-warm-gray mt-1">
              @sanatinrotasi
            </p>
            <p className="font-serif text-sm text-soft-black/70 mt-3">
              Görsel sanat dünyasından anlık paylaşımlar, sahne arkası ve ilham.
            </p>
          </a>
          <a
            href="https://youtube.com/@sanatinrotasi"
            target="_blank"
            rel="noopener noreferrer"
            className="block p-8 border border-ink/10 hover:border-accent/30 transition-colors group"
          >
            <h3 className="font-display text-xl font-bold text-ink group-hover:text-accent transition-colors">
              YouTube
            </h3>
            <p className="font-sans text-[0.7rem] uppercase tracking-[0.15em] text-warm-gray mt-1">
              @sanatinrotasi
            </p>
            <p className="font-serif text-sm text-soft-black/70 mt-3">
              Sanatçı portreleri, sergi turları, söyleşiler ve belgesel içerikler.
            </p>
          </a>
        </div>
      </section>
    </div>
  );
}
