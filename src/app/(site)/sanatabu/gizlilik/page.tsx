import Link from "next/link";
import SectionLabel from "@/components/shared/SectionLabel";
import type { Metadata } from "next";

/**
 * Sanatabu gizlilik politikası — App Store ve Google Play'in zorunlu tuttuğu
 * sayfa. Statik tutuldu: mağaza formlarına yazılan adresin CMS'teki bir
 * içerik değişikliğinden ya da sorgu hatasından etkilenmemesi gerekiyor.
 *
 * Metin uygulamanın gerçek davranışını anlatır; uygulama değişirse burası da
 * güncellenmeli (son güncelleme tarihi dahil).
 */

export const metadata: Metadata = {
  title: "Sanatabu Gizlilik Politikası",
  description:
    "Sanatabu mobil uygulamasının gizlilik politikası: hangi veriler işlenir, reklamlar nasıl çalışır, kamera izni ne için istenir.",
};

const SON_GUNCELLEME = "1 Ağustos 2026";

function Bolum({ baslik, children }: { baslik: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="font-display text-xl md:text-2xl font-bold text-ink mb-3">{baslik}</h2>
      <div className="font-serif text-base leading-relaxed text-soft-black space-y-3">
        {children}
      </div>
    </section>
  );
}

export default function SanatabuGizlilikPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 md:px-12 py-12">
      <header className="mb-10 animate-fade-up">
        <SectionLabel label="Yasal" className="mb-3 block" />
        <h1 className="font-display text-3xl md:text-4xl font-bold text-ink">
          Sanatabu <span className="italic text-accent">Gizlilik Politikası</span>
        </h1>
        <p className="font-sans text-xs text-warm-gray mt-2">
          Son güncelleme: {SON_GUNCELLEME}
        </p>
      </header>

      <div className="animate-fade-up stagger-1">
        <Bolum baslik="Özet">
          <p>
            Sanatabu hesap açmaz, kayıt istemez ve kişisel verilerinizi sunucularına
            göndermez. Oyun ayarlarınız, koleksiyonunuz ve varsa takım fotoğraflarınız
            yalnızca cihazınızda saklanır. Uygulamada Google AdMob aracılığıyla reklam
            gösterilir; reklam altyapısının işlediği tek veri cihazın reklam kimliğidir.
          </p>
        </Bolum>

        <Bolum baslik="Veri sorumlusu">
          <p>
            Sanatabu, Sanatın Rotası tarafından yayımlanır. Bu metinle ilgili sorularınız
            için{" "}
            <a
              href="mailto:bilgi@sanatinrotasi.com"
              className="text-accent hover:underline"
            >
              bilgi@sanatinrotasi.com
            </a>{" "}
            adresine yazabilirsiniz.
          </p>
        </Bolum>

        <Bolum baslik="Cihazınızda kalan veriler">
          <p>
            Takım adları ve renkleri, ses/titreşim gibi tercihler, oyun istatistikleriniz
            ve tamamladığınız tabloların koleksiyonu cihazınızın yerel deposunda tutulur.
            Bu veriler hiçbir yere gönderilmez; uygulamayı sildiğinizde birlikte silinir.
          </p>
        </Bolum>

        <Bolum baslik="Kamera izni">
          <p>
            Kamera izni yalnızca isteğe bağlı takım fotoğrafı için istenir ve
            reddedilebilir — oyun izinsiz de tam olarak çalışır. Çekilen fotoğraf
            yalnızca cihazda saklanır, hiçbir yere yüklenmez. Galeri erişimi istenmez.
          </p>
        </Bolum>

        <Bolum baslik="Reklamlar">
          <p>
            Uygulamada Google AdMob üzerinden ekranın altında bir banner ve maç sonunda
            en fazla bir geçiş reklamı gösterilir. Oyunun akışı (anlatım ve boyama
            ekranları) reklamla bölünmez. Ödüllü reklam ve açılış reklamı yoktur.
          </p>
          <p>
            AdMob, reklam kimliği gibi cihaz tanımlayıcılarını reklamcılık amacıyla
            işleyebilir. Reklam istekleri <strong>kişiselleştirilmemiş</strong> olarak
            gönderilir ve içerik derecelendirmesi genel izleyici (G) ile sınırlanır.
            Avrupa Birliği ve Birleşik Krallık kullanıcılarına ilk reklamdan önce Google
            onay formu (UMP) gösterilir; iOS&apos;ta ayrıca sistemin izleme izni
            (App Tracking Transparency) sorulur. İzin verilmezse uygulama
            kişiselleştirilmemiş reklamla çalışmaya devam eder.
          </p>
          <p>
            Google&apos;ın veri işleme uygulamaları için{" "}
            <a
              href="https://policies.google.com/technologies/partner-sites"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:underline"
            >
              Google Gizlilik Politikası
            </a>
            &apos;na bakabilirsiniz.
          </p>
        </Bolum>

        <Bolum baslik="Bülten ve kart geri bildirimi">
          <p>
            Bültene abone olmak ya da bir kartla ilgili geri bildirim göndermek
            isterseniz, ilgili metin cihazınızın kendi e-posta uygulamasında hazırlanır
            ve göndermeye siz karar verirsiniz. Uygulama e-posta adresinizi kendi içinde
            saklamaz.
          </p>
        </Bolum>

        <Bolum baslik="Çocuklar">
          <p>
            Sanatabu 12 yaş ve üzeri için önerilir. Klasik resim havuzunda sanatsal
            çıplaklık ve tarihî şiddet içeren eserler bulunduğundan, uygulamada
            varsayılan olarak <strong>açık</strong> gelen aile modu bu eserleri hem
            boyama tablolarından hem kartlardan gizler.
          </p>
        </Bolum>

        <Bolum baslik="Haklarınız">
          <p>
            Uygulama sizinle ilişkilendirilebilir bir veri saklamadığı için silme,
            düzeltme ya da erişim talebi gerektirecek bir kayıt tutulmaz. Cihazınızdaki
            tüm oyun verisini uygulamayı silerek kaldırabilirsiniz. Reklam kimliğinizi
            cihaz ayarlarından sıfırlayabilir ya da kişiselleştirilmiş reklamları
            kapatabilirsiniz.
          </p>
          <p>
            KVKK kapsamındaki genel haklarınız ve Sanatın Rotası platformunun veri
            uygulamaları için{" "}
            <Link href="/kvkk" className="text-accent hover:underline">
              KVKK Aydınlatma Metni
            </Link>{" "}
            sayfasına bakabilirsiniz.
          </p>
        </Bolum>

        <Bolum baslik="Değişiklikler">
          <p>
            Bu politika uygulamanın davranışı değiştikçe güncellenir; güncel sürüm her
            zaman bu sayfada yayımlanır ve yukarıdaki tarih yenilenir.
          </p>
        </Bolum>
      </div>
    </div>
  );
}
