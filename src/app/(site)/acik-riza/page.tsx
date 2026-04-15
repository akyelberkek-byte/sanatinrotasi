import SectionLabel from "@/components/shared/SectionLabel";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Açık Rıza Onayı",
  description: "Sanatın Rotası Açık Rıza Onayı Metni",
};

export default function AcikRizaPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 md:px-12 py-12">
      <header className="mb-10 animate-fade-up">
        <SectionLabel label="Yasal" className="mb-3 block" />
        <h1 className="font-display text-3xl md:text-4xl font-bold text-ink">
          Açık Rıza Onayı
        </h1>
        <p className="font-sans text-xs text-warm-gray mt-2">
          Son güncelleme: 15 Nisan 2026
        </p>
      </header>

      <div className="font-serif text-base leading-relaxed text-soft-black space-y-6 animate-fade-up stagger-1">
        <p>
          6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında, Sanatın Rotası
          platformu tarafından kişisel verilerinizin işlenmesine ilişkin açık rıza
          beyanınız aşağıda yer almaktadır.
        </p>

        <h2 className="font-display text-xl font-bold text-ink pt-4">
          Açık Rıza Beyanı
        </h2>
        <p>
          Sanatın Rotası platformuna üye olarak veya bülten aboneliği oluşturarak,
          aşağıdaki kişisel verilerimin belirtilen amaçlarla işlenmesine özgür iradem
          ile açık rıza verdiğimi kabul ve beyan ederim:
        </p>

        <h3 className="font-display text-lg font-bold text-ink pt-2">
          İşlenen Kişisel Veriler
        </h3>
        <ul className="list-disc pl-6 space-y-1">
          <li>Ad ve soyad</li>
          <li>E-posta adresi</li>
          <li>Üyelik ve profil bilgileri</li>
          <li>Platform kullanım verileri</li>
        </ul>

        <h3 className="font-display text-lg font-bold text-ink pt-2">İşleme Amaçları</h3>
        <ul className="list-disc pl-6 space-y-1">
          <li>Bülten ve bilgilendirme e-postalarının gönderilmesi</li>
          <li>Üyelik hizmetlerinin sunulması</li>
          <li>Platform içeriklerinin ve önerilerin kişiselleştirilmesi</li>
          <li>Etkinlik duyurularının yapılması</li>
          <li>İstatistiksel analizlerin gerçekleştirilmesi</li>
        </ul>

        <h3 className="font-display text-lg font-bold text-ink pt-2">Rızanın Geri Alınması</h3>
        <p>
          Açık rızanızı her zaman geri alma hakkına sahipsiniz. Rızanızı geri almak
          için{" "}
          <a href="/iletisim" className="text-accent link-underline">
            İletişim
          </a>{" "}
          sayfamız üzerinden veya bülten e-postalarındaki &quot;Abonelikten Çık&quot;
          bağlantısını kullanarak talebinizi iletebilirsiniz. Rızanızın geri alınması,
          geri alma tarihine kadar yapılan işlemlerin hukuka uygunluğunu etkilemez.
        </p>

        <h3 className="font-display text-lg font-bold text-ink pt-2">Verilerin Saklanması</h3>
        <p>
          Kişisel verileriniz, işleme amaçlarının gerektirdiği süre boyunca ve ilgili
          mevzuatın öngördüğü saklama süreleri kapsamında muhafaza edilecektir. Sürelerin
          dolması halinde verileriniz silinecek, yok edilecek veya anonim hale
          getirilecektir.
        </p>

        <div className="mt-8 p-6 border-2 border-ink/10 bg-paper/50">
          <p className="font-sans text-sm text-soft-black">
            Bu metni okuduğunuzu ve kişisel verilerinizin yukarıda belirtilen şekilde
            işlenmesine açık rıza verdiğinizi, platformumuza üye olarak veya bülten
            aboneliği oluşturarak onaylamış sayılırsınız.
          </p>
        </div>
      </div>
    </div>
  );
}
