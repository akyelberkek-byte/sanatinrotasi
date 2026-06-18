import { defineType, defineField } from "sanity";
import { turkishSlugify } from "../lib/slugify";

export const series = defineType({
  name: "series",
  title: "Dizi / Koleksiyon",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Dizi Başlığı",
      type: "string",
      description: "Örn: 'Hansel & Greta — Yeniden Yazım'",
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
      name: "description",
      title: "Açıklama",
      type: "text",
      rows: 3,
      description: "Bu dizinin neyi ele aldığı, kısa özet",
    }),
    defineField({
      name: "coverImage",
      title: "Kapak Görseli",
      type: "image",
      options: { hotspot: true },
    }),
    defineField({
      name: "active",
      title: "Aktif",
      type: "boolean",
      description: "Kapalıysa: site listelerinde gizlenir",
      initialValue: true,
    }),
  ],
  preview: {
    select: {
      title: "title",
      media: "coverImage",
      active: "active",
    },
    prepare({ title, media, active }) {
      return {
        title: `${title} ${active ? "" : "(pasif)"}`,
        media,
      };
    },
  },
});
