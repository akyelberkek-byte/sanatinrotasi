import { defineType, defineField } from "sanity";
import { turkishSlugify } from "../lib/slugify";

export const route = defineType({
  name: "route",
  title: "Sanat Rotası",
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
      options: { source: "title", maxLength: 96, slugify: turkishSlugify },
      validation: (r) => r.required(),
    }),
    defineField({
      name: "subtitle",
      title: "Alt Başlık",
      type: "string",
    }),
    defineField({
      name: "city",
      title: "Şehir",
      type: "string",
      initialValue: "Eskişehir",
    }),
    defineField({
      name: "mainImage",
      title: "Ana Görsel",
      type: "image",
      options: { hotspot: true },
    }),
    defineField({
      name: "description",
      title: "Açıklama",
      type: "portableText",
    }),
    defineField({
      name: "stops",
      title: "Duraklar",
      type: "array",
      of: [
        {
          type: "object",
          name: "stop",
          title: "Durak",
          fields: [
            defineField({ name: "name", title: "Durak Adı", type: "string", validation: (r) => r.required() }),
            defineField({ name: "description", title: "Açıklama", type: "text", rows: 3 }),
            defineField({ name: "image", title: "Görsel", type: "image", options: { hotspot: true } }),
            defineField({ name: "location", title: "Konum", type: "geopoint" }),
            defineField({
              name: "relatedArticle",
              title: "İlgili Yazı",
              type: "reference",
              to: [{ type: "article" }],
            }),
          ],
          preview: {
            select: { title: "name", media: "image" },
          },
        },
      ],
    }),
    defineField({
      name: "duration",
      title: "Süre",
      type: "string",
      description: "Ör: Yarım gün, Tam gün, 2-3 saat",
    }),
    defineField({
      name: "difficulty",
      title: "Zorluk",
      type: "string",
      options: {
        list: [
          { title: "Kolay", value: "kolay" },
          { title: "Orta", value: "orta" },
          { title: "Uzun", value: "uzun" },
        ],
      },
    }),
    defineField({
      name: "tags",
      title: "Etiketler",
      type: "array",
      of: [{ type: "string" }],
      options: { layout: "tags" },
    }),
    defineField({
      name: "featured",
      title: "Öne Çıkan",
      type: "boolean",
      initialValue: false,
    }),
    defineField({
      name: "seo",
      title: "SEO",
      type: "seo",
    }),
  ],
  preview: {
    select: { title: "title", city: "city", media: "mainImage" },
    prepare({ title, city, media }) {
      return { title, subtitle: city, media };
    },
  },
});
