import { defineType, defineField } from "sanity";

export const seo = defineType({
  name: "seo",
  title: "SEO Ayarları",
  type: "object",
  fields: [
    defineField({
      name: "metaTitle",
      title: "Meta Başlık",
      type: "string",
      description: "Arama motorlarında görünecek başlık (max 60 karakter)",
      validation: (r) => r.max(60),
    }),
    defineField({
      name: "metaDescription",
      title: "Meta Açıklama",
      type: "text",
      rows: 3,
      description: "Arama motorlarında görünecek açıklama (max 160 karakter)",
      validation: (r) => r.max(160),
    }),
    defineField({
      name: "ogImage",
      title: "Sosyal Medya Görseli",
      type: "image",
      description: "1200x630px önerilir",
    }),
  ],
});
