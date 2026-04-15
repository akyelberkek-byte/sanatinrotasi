import { defineType, defineField } from "sanity";

export const siteSettings = defineType({
  name: "siteSettings",
  title: "Site Ayarları",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Site Başlığı",
      type: "string",
      initialValue: "Sanatın Rotası",
    }),
    defineField({
      name: "description",
      title: "Site Açıklaması",
      type: "text",
      rows: 3,
    }),
    defineField({
      name: "logo",
      title: "Logo",
      type: "image",
    }),
    defineField({
      name: "ogImage",
      title: "Varsayılan Sosyal Medya Görseli",
      type: "image",
      description: "1200x630px önerilir",
    }),
    defineField({
      name: "heroHeading",
      title: "Ana Sayfa Hero Başlık",
      type: "string",
    }),
    defineField({
      name: "heroSubheading",
      title: "Ana Sayfa Hero Alt Başlık",
      type: "string",
    }),
    defineField({
      name: "heroImage",
      title: "Ana Sayfa Hero Görseli",
      type: "image",
      options: { hotspot: true },
    }),
    defineField({
      name: "manifesto",
      title: "Manifesto",
      type: "portableText",
    }),
    defineField({
      name: "socialLinks",
      title: "Sosyal Medya",
      type: "object",
      fields: [
        defineField({ name: "instagram", title: "Instagram", type: "url" }),
        defineField({ name: "youtube", title: "YouTube", type: "url" }),
        defineField({ name: "twitter", title: "Twitter/X", type: "url" }),
      ],
    }),
    defineField({
      name: "footerText",
      title: "Footer Metni",
      type: "string",
      initialValue: "© 2026 Sanatın Rotası — Tüm hakları saklıdır.",
    }),
    defineField({
      name: "topBarLeft",
      title: "Üst Bar Sol Metin",
      type: "string",
      initialValue: "Eskişehir — Türkiye",
    }),
    defineField({
      name: "topBarRight",
      title: "Üst Bar Sağ Metin",
      type: "string",
      initialValue: "Sanat & Kültür Platformu",
    }),
  ],
  preview: {
    prepare() {
      return { title: "Site Ayarları" };
    },
  },
});
