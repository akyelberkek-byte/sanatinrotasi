import { defineType, defineField } from "sanity";

export const siteSettings = defineType({
  name: "siteSettings",
  title: "Site Ayarları",
  type: "document",
  groups: [
    { name: "general", title: "Genel" },
    { name: "hero", title: "Ana Sayfa — Hero" },
    { name: "manifesto", title: "Ana Sayfa — Manifesto" },
    { name: "founding", title: "Nasıl Kuruldu" },
    { name: "submitArt", title: "Sanatını Tanıt" },
    { name: "sections", title: "Bölüm Başlıkları" },
    { name: "newsletter", title: "Bülten" },
    { name: "social", title: "Sosyal Medya" },
  ],
  fields: [
    // GENEL
    defineField({
      name: "title",
      title: "Site Başlığı",
      type: "string",
      group: "general",
      initialValue: "Sanatın Rotası",
    }),
    defineField({
      name: "description",
      title: "Site Açıklaması (SEO için)",
      type: "text",
      rows: 3,
      group: "general",
    }),
    defineField({
      name: "logo",
      title: "Logo",
      type: "image",
      group: "general",
    }),
    defineField({
      name: "ogImage",
      title: "Varsayılan Sosyal Medya Görseli",
      type: "image",
      description: "1200x630px önerilir",
      group: "general",
    }),
    defineField({
      name: "topBarLeft",
      title: "Üst Bar — Sol Metin",
      type: "string",
      group: "general",
      initialValue: "Eskişehir — Türkiye",
    }),
    defineField({
      name: "topBarRight",
      title: "Üst Bar — Sağ Metin",
      type: "string",
      group: "general",
      initialValue: "Sanat & Kültür Platformu",
    }),
    defineField({
      name: "footerText",
      title: "Footer Telif Metni",
      type: "string",
      group: "general",
      initialValue: "© 2026 Sanatın Rotası — Tüm hakları saklıdır.",
    }),

    // HERO
    defineField({
      name: "heroHeading",
      title: "Ana Sayfa — Hero Başlık",
      type: "string",
      group: "hero",
      description: "Ör: Sanatın",
      initialValue: "Sanatın",
    }),
    defineField({
      name: "heroHeadingItalic",
      title: "Ana Sayfa — Hero Başlık (italic kısım)",
      type: "string",
      group: "hero",
      description: "Ör: Rotası",
      initialValue: "Rotası",
    }),
    defineField({
      name: "heroSubheading",
      title: "Ana Sayfa — Hero Alt Başlık",
      type: "string",
      group: "hero",
      initialValue: "Türkiye'nin Sanat & Kültür Platformu",
    }),
    defineField({
      name: "heroDescription",
      title: "Ana Sayfa — Hero Açıklama",
      type: "text",
      rows: 3,
      group: "hero",
      description: "Hero altındaki bold tanıtım metni",
    }),

    // MANİFESTO
    defineField({
      name: "manifestoLabel",
      title: "Manifesto Etiketi",
      type: "string",
      group: "manifesto",
      initialValue: "Manifesto",
    }),
    defineField({
      name: "manifesto",
      title: "Manifesto İçeriği",
      type: "portableText",
      group: "manifesto",
      description: "Ana sayfada drop-cap ile gösterilen manifesto paragrafları",
    }),
    defineField({
      name: "founderLabel",
      title: "Kurucu Etiketi",
      type: "string",
      group: "manifesto",
      initialValue: "Kurucu",
    }),

    // NASIL KURULDU
    defineField({
      name: "foundingStoryLabel",
      title: "Bölüm Etiketi",
      type: "string",
      group: "founding",
      initialValue: "Nasıl Kuruldu",
      description: "Başlığın üzerindeki küçük etiket (ör. 'Nasıl Kuruldu')",
    }),
    defineField({
      name: "foundingStoryHeading",
      title: "Bölüm Başlığı",
      type: "string",
      group: "founding",
      initialValue: "Sanatın Rotası Nasıl Kuruldu?",
    }),
    defineField({
      name: "foundingStory",
      title: "Nasıl Kuruldu İçeriği",
      type: "portableText",
      group: "founding",
      description: "Ana sayfa ve Hakkında sayfasında gösterilen kuruluş hikayesi",
    }),

    // SANATINI TANIT
    defineField({
      name: "submitArtLabel",
      title: "Bölüm Etiketi",
      type: "string",
      group: "submitArt",
      initialValue: "Sanatını Tanıt",
    }),
    defineField({
      name: "submitArtHeading",
      title: "Bölüm Başlığı — İlk Kısım",
      type: "string",
      group: "submitArt",
      initialValue: "Sanatını",
    }),
    defineField({
      name: "submitArtHeadingItalic",
      title: "Bölüm Başlığı — İtalik Kısım",
      type: "string",
      group: "submitArt",
      initialValue: "Tanıt",
    }),
    defineField({
      name: "submitArtDescription",
      title: "Açıklama Metni",
      type: "text",
      rows: 4,
      group: "submitArt",
      initialValue:
        "Sanatın Rotası'nda sanatçılara ve üretimlere yer vermeyi önemsiyoruz. Sen de kendi hikâyeni bizimle paylaşabilir, röportaj talebinde bulunabilir veya sanatını tanıtabilirsin.",
    }),
    defineField({
      name: "submitArtCtaText",
      title: "Buton Metni",
      type: "string",
      group: "submitArt",
      initialValue: "İletişime Geç",
    }),
    defineField({
      name: "submitArtCtaUrl",
      title: "Buton Bağlantısı",
      type: "string",
      group: "submitArt",
      initialValue: "/iletisim",
      description: "Örn: '/iletisim' veya 'mailto:iletisim@sanatinrotasi.com'",
    }),

    // BÖLÜM BAŞLIKLARI
    defineField({
      name: "categoriesLabel",
      title: "Kategoriler Bölüm Başlığı",
      type: "string",
      group: "sections",
      initialValue: "Kategoriler",
    }),
    defineField({
      name: "latestArticlesLabel",
      title: "Son Yazılar Bölüm Başlığı",
      type: "string",
      group: "sections",
      initialValue: "Son Yazılar",
    }),
    defineField({
      name: "upcomingEventsLabel",
      title: "Yaklaşan Etkinlikler Bölüm Başlığı",
      type: "string",
      group: "sections",
      initialValue: "Yaklaşan Etkinlikler",
    }),
    defineField({
      name: "artRoutesLabel",
      title: "Sanat Rotaları Bölüm Başlığı",
      type: "string",
      group: "sections",
      initialValue: "Sanat Rotaları",
    }),
    defineField({
      name: "viewAllLabel",
      title: "Tümünü Gör Etiketi",
      type: "string",
      group: "sections",
      initialValue: "Tümünü Gör",
    }),

    // NEWSLETTER
    defineField({
      name: "newsletterTitle",
      title: "Bülten Başlığı",
      type: "string",
      group: "newsletter",
      initialValue: "Rotaya",
    }),
    defineField({
      name: "newsletterTitleItalic",
      title: "Bülten Başlığı (italic kısım)",
      type: "string",
      group: "newsletter",
      initialValue: "Katıl",
    }),
    defineField({
      name: "newsletterDescription",
      title: "Bülten Açıklaması",
      type: "text",
      rows: 2,
      group: "newsletter",
      initialValue: "Yeni yazılar, etkinlikler ve rotalar hakkında ilk sen haberdar ol.",
    }),
    defineField({
      name: "newsletterNote",
      title: "Bülten Not Metni",
      type: "string",
      group: "newsletter",
      initialValue: "Sadece sanat. Asla spam değil.",
    }),

    // SOSYAL MEDYA
    defineField({
      name: "socialLinks",
      title: "Sosyal Medya Linkleri",
      type: "object",
      group: "social",
      fields: [
        defineField({ name: "instagram", title: "Instagram URL", type: "url" }),
        defineField({ name: "youtube", title: "YouTube URL", type: "url" }),
        defineField({ name: "pinterest", title: "Pinterest URL", type: "url" }),
        defineField({ name: "udemy", title: "Udemy URL", type: "url" }),
        defineField({ name: "twitter", title: "Twitter/X URL", type: "url" }),
      ],
    }),
  ],
  preview: {
    prepare() {
      return { title: "Site Ayarları" };
    },
  },
});
