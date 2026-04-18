import Image from "next/image";
import SectionLabel from "@/components/shared/SectionLabel";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Hakkında",
  description: "Sanatın Rotası hakkında — platform hikayesi, manifesto ve kurucu Ela Kantarcı.",
};

export default function HakkindaPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 md:px-12 py-12">
      {/* Hero */}
      <header className="mb-12 animate-fade-up">
        <SectionLabel label="Hakkında" className="mb-3 block" />
        <h1 className="font-display text-4xl md:text-5xl font-bold text-ink">
          Sanatın Rotası <span className="italic text-accent">Hakkında</span>
        </h1>
      </header>

      {/* Manifesto */}
      <section className="mb-16 animate-fade-up stagger-1">
        <SectionLabel label="Manifesto" className="mb-4 block" />
        <div className="font-serif text-xl md:text-2xl leading-relaxed text-soft-black space-y-6">
          <p className="drop-cap">
            Her sanat eseri bir yolculuk, her sergi bir durak, her sanatçı bir rehberdir.
            Sanatın Rotası, bu yolculukta size eşlik etmek için kuruldu.
          </p>
          <p>
            Türkiye&apos;nin zengin sanat ve kültür dünyasını bir araya getiriyoruz. Görsel
            sanatlardan müziğe, sinemadan edebiyata, sahne sanatlarından sokak sanatına kadar
            her disiplini editöryel bir bakış açısıyla keşfediyoruz.
          </p>
          <p>
            Biz sadece gözlemlemiyor, anlatıyoruz. Küratörlü rotalarımızla şehirlerin sanat
            damarlarını keşfediyor, etkinliklerimizle sanatı herkes için erişilebilir kılıyoruz.
          </p>
        </div>
      </section>

      {/* Founder */}
      <section className="mb-16 animate-fade-up stagger-2">
        <SectionLabel label="Kurucu" className="mb-6 block" />
        <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-10">
          <div>
            <div className="relative">
              <Image
                src="/images/ela-kantarci.jpg"
                alt="Ela Kantarcı — Sanatın Rotası Kurucu ve Sanat İçeriği Üreticisi"
                width={300}
                height={336}
                loading="lazy"
                className="w-full grayscale-[15%] hover:grayscale-0 transition-all duration-500"
              />
              <div className="absolute inset-[8px] border border-white/40 pointer-events-none" />
            </div>
          </div>
          <div>
            <h2 className="font-display text-2xl font-bold text-ink">Ela Kantarcı</h2>
            <p className="font-sans text-[0.7rem] uppercase tracking-[0.2em] text-accent mt-1 mb-4">
              Kurucu & Sanat İçeriği Üreticisi
            </p>
            <div className="font-serif text-lg leading-relaxed text-soft-black space-y-4">
              <p>
                Multidisipliner bir bakış açısıyla sanata yaklaşan, Eskişehir&apos;in kültür
                sahnesini Türkiye&apos;ye taşımayı hedefleyen bir sanat tutkunu.
              </p>
              <p>
                Sanatın Rotası, Ela&apos;nın sanata olan tutkusunu ve editöryel vizyonunu
                bir araya getiren bir platform olarak doğdu.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Vision */}
      <section className="border-t-2 border-b-2 border-ink py-12 animate-fade-up stagger-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="font-display text-lg font-bold text-ink mb-3">Vizyon</h3>
            <p className="font-serif text-base text-soft-black/80 leading-relaxed">
              Türkiye&apos;nin en kapsamlı ve erişilebilir sanat & kültür platformu olmak.
            </p>
          </div>
          <div>
            <h3 className="font-display text-lg font-bold text-ink mb-3">Misyon</h3>
            <p className="font-serif text-base text-soft-black/80 leading-relaxed">
              Sanatı herkes için anlaşılır ve ulaşılabilir kılmak; yerel sanat sahnesini
              ulusal düzeyde görünür hale getirmek.
            </p>
          </div>
          <div>
            <h3 className="font-display text-lg font-bold text-ink mb-3">Değerler</h3>
            <p className="font-serif text-base text-soft-black/80 leading-relaxed">
              Erişilebilirlik, küratörlük kalitesi, çok disiplinlilik ve topluluk odaklılık.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
