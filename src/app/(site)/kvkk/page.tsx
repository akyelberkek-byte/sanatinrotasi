import SectionLabel from "@/components/shared/SectionLabel";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "KVKK Aydınlatma Metni",
  description: "Sanatın Rotası Kişisel Verilerin Korunması Kanunu (KVKK) Aydınlatma Metni",
};

export default function KVKKPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 md:px-12 py-12">
      <header className="mb-10 animate-fade-up">
        <SectionLabel label="Yasal" className="mb-3 block" />
        <h1 className="font-display text-3xl md:text-4xl font-bold text-ink">
          KVKK Aydınlatma Metni
        </h1>
        <p className="font-sans text-xs text-warm-gray mt-2">
          Son güncelleme: 15 Nisan 2026
        </p>
      </header>

      <div className="font-serif text-base leading-relaxed text-soft-black space-y-6 animate-fade-up stagger-1">
        <p>
          6698 sayılı Kişisel Verilerin Korunması Kanunu (&quot;KVKK&quot;) uyarınca,
          Sanatın Rotası olarak kişisel verilerinizin güvenliği hususuna azami hassasiyet
          göstermekteyiz. Bu aydınlatma metni, kişisel verilerinizin nasıl işlendiği
          hakkında sizleri bilgilendirmek amacıyla hazırlanmıştır.
        </p>

        <h2 className="font-display text-xl font-bold text-ink pt-4">1. Veri Sorumlusu</h2>
        <p>
          Sanatın Rotası platformu adına veri sorumlusu olarak hareket eden kişi,
          platform kurucusu Ela Kantarcı&apos;dır. İletişim bilgilerine &quot;İletişim&quot;
          sayfamızdan ulaşabilirsiniz.
        </p>

        <h2 className="font-display text-xl font-bold text-ink pt-4">
          2. İşlenen Kişisel Veriler
        </h2>
        <p>Platformumuz aracılığıyla aşağıdaki kişisel veriler işlenmektedir:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Kimlik bilgileri (ad, soyad)</li>
          <li>İletişim bilgileri (e-posta adresi)</li>
          <li>Üyelik bilgileri (kullanıcı adı, profil bilgileri)</li>
          <li>İşlem güvenliği bilgileri (IP adresi, çerez verileri)</li>
        </ul>

        <h2 className="font-display text-xl font-bold text-ink pt-4">
          3. Kişisel Verilerin İşlenme Amaçları
        </h2>
        <p>Kişisel verileriniz aşağıdaki amaçlarla işlenmektedir:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Bülten hizmetinin sunulması</li>
          <li>Üyelik işlemlerinin gerçekleştirilmesi</li>
          <li>İletişim taleplerinin yanıtlanması</li>
          <li>Platform içeriklerinin kişiselleştirilmesi</li>
          <li>Yasal yükümlülüklerin yerine getirilmesi</li>
        </ul>

        <h2 className="font-display text-xl font-bold text-ink pt-4">
          4. Kişisel Verilerin Aktarılması
        </h2>
        <p>
          Kişisel verileriniz, yukarıda belirtilen amaçların gerçekleştirilmesi
          doğrultusunda, iş ortaklarımıza, tedarikçilerimize ve yasal olarak yetkili
          kurum ve kuruluşlara KVKK&apos;nın 8. ve 9. maddelerinde belirtilen kişisel
          veri işleme şartları ve amaçları çerçevesinde aktarılabilecektir.
        </p>

        <h2 className="font-display text-xl font-bold text-ink pt-4">
          5. Kişisel Verilerin Toplanma Yöntemi ve Hukuki Sebebi
        </h2>
        <p>
          Kişisel verileriniz, platformumuzun web sitesi, e-posta ve diğer elektronik
          ortamlar aracılığıyla otomatik ve otomatik olmayan yollarla toplanmaktadır.
          Hukuki sebep olarak açık rızanız, sözleşmenin ifası ve meşru menfaat
          dayanaklarına başvurulmaktadır.
        </p>

        <h2 className="font-display text-xl font-bold text-ink pt-4">
          6. Haklarınız
        </h2>
        <p>KVKK&apos;nın 11. maddesi uyarınca aşağıdaki haklara sahipsiniz:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme</li>
          <li>İşlenmişse buna ilişkin bilgi talep etme</li>
          <li>İşlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme</li>
          <li>Eksik veya yanlış işlenmişse düzeltilmesini isteme</li>
          <li>KVKK&apos;nın 7. maddesinde öngörülen şartlar çerçevesinde silinmesini isteme</li>
          <li>İşlenen verilerin münhasıran otomatik sistemler vasıtasıyla analiz edilmesi suretiyle aleyhinize bir sonucun ortaya çıkmasına itiraz etme</li>
        </ul>

        <p className="pt-4">
          Haklarınıza ilişkin taleplerinizi{" "}
          <a href="/iletisim" className="text-accent link-underline">
            İletişim
          </a>{" "}
          sayfamız üzerinden bize iletebilirsiniz.
        </p>
      </div>
    </div>
  );
}
