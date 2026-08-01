import Image from "next/image";
import Link from "next/link";
import SectionLabel from "@/components/shared/SectionLabel";
import type { Metadata } from "next";

/**
 * Sanatabu tanıtım sayfası.
 *
 * Bilinçli olarak tamamen statik: Sanity'ye sorgu atmaz, site ayarlarına
 * bağlı değildir. CMS'te bir şey değişse ya da sorgu hata verse bile bu sayfa
 * (ve mağazaların zorunlu tuttuğu gizlilik alt sayfası) ayakta kalır.
 */

export const metadata: Metadata = {
  title: "Sanatabu",
  description:
    "Sanatın Rotası'nın sanat temalı kelime oyunu: kelimeyi anlat, doğrularınla tablonu boya. 43 kategori, 4.300'den fazla kart, internetsiz oynanır.",
};

const OZELLIKLER = [
  {
    baslik: "Anlat",
    metin:
      "Karttaki kelimeyi takımına anlat — ama altındaki beş yasaklı kelimeye dokunma.",
  },
  {
    baslik: "Boya",
    metin:
      "Her doğru cevap, takımının tablosundan bir parçayı gerçek renklerine kavuşturur.",
  },
  {
    baslik: "Öğren",
    metin:
      "Tur aralarında o turda çıkan her kart için doğrulanmış bir sanat notu okursun.",
  },
];

export default function SanatabuPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 md:px-12 py-12">
      <header className="mb-12 animate-fade-up">
        <SectionLabel label="Oyun" className="mb-3 block" />
        <h1 className="font-display text-4xl md:text-5xl font-bold text-ink">
          Sanat<span className="italic text-accent">abu</span>
        </h1>
        <p className="font-serif text-lg text-soft-black/70 mt-3 max-w-2xl">
          Sanatı anlat, tabloyu boya.
        </p>
      </header>

      <section className="grid md:grid-cols-2 gap-10 md:gap-12 items-center animate-fade-up stagger-1">
        <div>
          <p className="font-serif text-base md:text-lg leading-relaxed text-soft-black">
            Sanatabu, iki takımın tek telefonla elden ele oynadığı sanat temalı bir parti
            oyunudur. Ödül tablodur: her takım oyun başında soluk bir eskiz alır, turda
            yapılan her doğru o eskizden bir parçayı gerçek renklerine kavuşturur.
            48 parçalık başyapıtı ilk tamamlayan takım kazanır.
          </p>
          <p className="font-serif text-base md:text-lg leading-relaxed text-soft-black mt-4">
            Resimden heykele, operadan ebruya 43 kategori ve 4.300&apos;den fazla özgün
            kart var. Tek kişilik &laquo;İpucu Avı&raquo; modu da eklendi. İnternet
            gerekmez, kayıt istemez, tek cihazda oynanır.
          </p>

          <dl className="mt-8 space-y-4">
            {OZELLIKLER.map((o) => (
              <div key={o.baslik} className="border-l-2 border-accent/40 pl-4">
                <dt className="font-sans text-[0.7rem] uppercase tracking-[0.2em] text-accent">
                  {o.baslik}
                </dt>
                <dd className="font-serif text-base text-soft-black mt-1">{o.metin}</dd>
              </div>
            ))}
          </dl>

          <p className="font-sans text-xs uppercase tracking-[0.2em] text-warm-gray mt-8">
            Yakında App Store ve Google Play&apos;de
          </p>

          <Link
            href="/sanatabu/gizlilik"
            className="inline-flex items-center gap-2 mt-4 font-sans text-[0.7rem] uppercase tracking-[0.15em] text-soft-black hover:text-accent transition-colors link-underline"
          >
            Gizlilik Politikası
            <span aria-hidden="true">→</span>
          </Link>
        </div>

        <div className="justify-self-center">
          <Image
            src="/images/sanatabu/ana-sayfa.png"
            alt="Sanatabu uygulamasının ana ekranı"
            width={720}
            height={1564}
            sizes="(max-width: 768px) 70vw, 320px"
            className="w-[240px] md:w-[320px] h-auto border border-ink/10 shadow-sm"
            priority
          />
        </div>
      </section>
    </div>
  );
}
