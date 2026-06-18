import { defineType, defineField } from "sanity";
import { turkishSlugify } from "../lib/slugify";

export const article = defineType({
  name: "article",
  title: "Yazı",
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
      options: {
        source: "title",
        maxLength: 96,
        slugify: turkishSlugify,
      },
      description:
        "URL'deki kısım. Başlığa göre otomatik oluşur. Türkçe karakter, boşluk ve noktalama içermez.",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "author",
      title: "Yazar",
      type: "reference",
      to: [{ type: "author" }],
    }),
    defineField({
      name: "category",
      title: "Kategori",
      type: "reference",
      to: [{ type: "category" }],
      validation: (r) => r.required(),
    }),
    defineField({
      name: "publishedAt",
      title: "Yayın Tarihi",
      type: "datetime",
      initialValue: () => new Date().toISOString(),
    }),
    defineField({
      name: "mainImage",
      title: "Ana Görsel",
      type: "image",
      options: { hotspot: true },
      fields: [
        {
          name: "alt",
          title: "Alt Metin",
          type: "string",
        },
      ],
    }),
    defineField({
      name: "excerpt",
      title: "Özet",
      type: "text",
      rows: 3,
      description: "Yazı listesinde görünecek kısa açıklama (max 200 karakter)",
      validation: (r) => r.max(200),
    }),
    defineField({
      name: "body",
      title: "İçerik",
      type: "portableText",
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
      name: "editorsPick",
      title: "Editör Seçimi",
      type: "boolean",
      description: "İşaretlerse ana sayfada 'Editör Seçimi' bölümünde döner",
      initialValue: false,
    }),
    defineField({
      name: "issueNumber",
      title: "Sayı Numarası",
      type: "number",
      description:
        "Dergi tarzı seri numarası. Örn: 42 → 'Sayı № 42'. Boş bırakırsan rozet gösterilmez.",
    }),
    defineField({
      name: "series",
      title: "Dizi / Koleksiyon",
      type: "reference",
      to: [{ type: "series" }],
      description:
        "Bu yazı bir diziyi mi tamamlıyor? Önce 'Diziler' sekmesinden oluştur.",
    }),
    defineField({
      name: "seriesPart",
      title: "Dizide Bölüm Numarası",
      type: "number",
      description: "Diziye dahilse bölüm sırası. Örn: 1, 2, 3...",
      hidden: ({ document }) => !document?.series,
    }),
    defineField({
      name: "seo",
      title: "SEO",
      type: "seo",
    }),
  ],
  preview: {
    select: {
      title: "title",
      author: "author.name",
      media: "mainImage",
      category: "category.title",
    },
    prepare({ title, author, media, category }) {
      return {
        title,
        subtitle: `${category || ""} — ${author || ""}`,
        media,
      };
    },
  },
  orderings: [
    {
      title: "Yayın Tarihi (Yeni → Eski)",
      name: "publishedAtDesc",
      by: [{ field: "publishedAt", direction: "desc" }],
    },
  ],
});
