import { defineType, defineField } from "sanity";

export const page = defineType({
  name: "page",
  title: "Sayfa",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Başlık",
      type: "string",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "slug",
      title: "URL Slug",
      type: "slug",
      options: { source: "title", maxLength: 96 },
      validation: (r) => r.required(),
    }),
    defineField({
      name: "sectionLabel",
      title: "Bölüm Etiketi",
      type: "string",
      description: "Başlığın üzerindeki küçük etiket (ör. 'Hakkında', 'Yasal')",
    }),
    defineField({
      name: "headingPrefix",
      title: "Başlık — İlk Kısım",
      type: "string",
      description: "Ör: 'Sanatın Rotası' (düz kısım)",
    }),
    defineField({
      name: "headingHighlight",
      title: "Başlık — Vurgulu Kısım (italic renkli)",
      type: "string",
      description: "Ör: 'Hakkında' (vurgulu kısım)",
    }),
    defineField({
      name: "subtitle",
      title: "Alt Başlık / Açıklama",
      type: "text",
      rows: 2,
    }),
    defineField({
      name: "lastUpdated",
      title: "Son Güncelleme Tarihi",
      type: "date",
      description: "Yasal sayfalar için (KVKK, Açık Rıza)",
    }),
    defineField({
      name: "body",
      title: "İçerik",
      type: "portableText",
    }),
    defineField({
      name: "seo",
      title: "SEO",
      type: "seo",
    }),
  ],
  preview: {
    select: { title: "title", subtitle: "slug.current" },
    prepare({ title, subtitle }) {
      return {
        title,
        subtitle: subtitle ? `/${subtitle}` : "",
      };
    },
  },
});
