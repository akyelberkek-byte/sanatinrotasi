import { defineType, defineField } from "sanity";

export const event = defineType({
  name: "event",
  title: "Etkinlik",
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
      name: "eventType",
      title: "Etkinlik Türü",
      type: "string",
      options: {
        list: [
          { title: "Atölye", value: "atolye" },
          { title: "Söyleşi", value: "soylesi" },
          { title: "Sergi", value: "sergi" },
          { title: "Performans", value: "performans" },
          { title: "Konser", value: "konser" },
          { title: "Festival", value: "festival" },
          { title: "Diğer", value: "diger" },
        ],
      },
      validation: (r) => r.required(),
    }),
    defineField({
      name: "date",
      title: "Başlangıç Tarihi",
      type: "datetime",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "endDate",
      title: "Bitiş Tarihi",
      type: "datetime",
    }),
    defineField({
      name: "location",
      title: "Konum",
      type: "object",
      fields: [
        defineField({ name: "name", title: "Mekan Adı", type: "string" }),
        defineField({ name: "address", title: "Adres", type: "string" }),
        defineField({ name: "city", title: "Şehir", type: "string", initialValue: "Eskişehir" }),
        defineField({ name: "geopoint", title: "Konum (Harita)", type: "geopoint" }),
      ],
    }),
    defineField({
      name: "mainImage",
      title: "Görsel",
      type: "image",
      options: { hotspot: true },
    }),
    defineField({
      name: "description",
      title: "Açıklama",
      type: "portableText",
    }),
    defineField({
      name: "price",
      title: "Ücret",
      type: "object",
      fields: [
        defineField({ name: "isFree", title: "Ücretsiz mi?", type: "boolean", initialValue: true }),
        defineField({ name: "amount", title: "Tutar (TL)", type: "number" }),
      ],
    }),
    defineField({
      name: "externalUrl",
      title: "Bilet / Kayıt Linki",
      type: "url",
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
    select: { title: "title", date: "date", type: "eventType", media: "mainImage" },
    prepare({ title, date, type, media }) {
      const d = date ? new Date(date).toLocaleDateString("tr-TR") : "";
      return { title, subtitle: `${type || ""} — ${d}`, media };
    },
  },
  orderings: [
    {
      title: "Tarih (Yaklaşan)",
      name: "dateAsc",
      by: [{ field: "date", direction: "asc" }],
    },
  ],
});
