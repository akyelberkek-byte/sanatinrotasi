import { defineType, defineField } from "sanity";

export const author = defineType({
  name: "author",
  title: "Yazar",
  type: "document",
  fields: [
    defineField({
      name: "name",
      title: "Ad Soyad",
      type: "string",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "slug",
      title: "URL Slug",
      type: "slug",
      options: { source: "name", maxLength: 96 },
      validation: (r) => r.required(),
    }),
    defineField({
      name: "image",
      title: "Fotoğraf",
      type: "image",
      options: { hotspot: true },
    }),
    defineField({
      name: "role",
      title: "Rol",
      type: "string",
      description: "Ör: Kurucu & Sanat İçeriği Üreticisi",
    }),
    defineField({
      name: "bio",
      title: "Biyografi",
      type: "array",
      of: [{ type: "block" }],
    }),
    defineField({
      name: "social",
      title: "Sosyal Medya",
      type: "object",
      fields: [
        defineField({ name: "instagram", title: "Instagram", type: "url" }),
        defineField({ name: "youtube", title: "YouTube", type: "url" }),
        defineField({ name: "website", title: "Web Sitesi", type: "url" }),
      ],
    }),
  ],
  preview: {
    select: { title: "name", media: "image", subtitle: "role" },
  },
});
