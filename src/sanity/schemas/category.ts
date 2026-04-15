import { defineType, defineField } from "sanity";

export const category = defineType({
  name: "category",
  title: "Kategori",
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
      name: "description",
      title: "Açıklama",
      type: "text",
      rows: 3,
    }),
    defineField({
      name: "color",
      title: "Renk",
      type: "string",
      description: "Hex renk kodu (ör. #c45d3e)",
    }),
    defineField({
      name: "order",
      title: "Sıralama",
      type: "number",
    }),
  ],
  orderings: [{ title: "Sıralama", name: "order", by: [{ field: "order", direction: "asc" }] }],
});
