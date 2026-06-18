import { defineType, defineField } from "sanity";

export const dailyArtwork = defineType({
  name: "dailyArtwork",
  title: "Günün Eseri",
  type: "document",
  description:
    "Ana sayfada gösterilecek 'Günün Eseri' havuzu. Birden fazla ekleyebilirsin — site her gün havuzdan rastgele bir tanesini seçer.",
  fields: [
    defineField({
      name: "title",
      title: "Eser Adı",
      type: "string",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "artist",
      title: "Sanatçı",
      type: "string",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "year",
      title: "Yıl",
      type: "string",
      description: "Örn: 1889, 19. yy, c. 1850",
    }),
    defineField({
      name: "medium",
      title: "Teknik / Malzeme",
      type: "string",
      description: "Örn: Tuval üzerine yağlıboya",
    }),
    defineField({
      name: "image",
      title: "Görsel",
      type: "image",
      options: { hotspot: true },
      validation: (r) => r.required(),
    }),
    defineField({
      name: "description",
      title: "Kısa Açıklama",
      type: "text",
      rows: 3,
      description: "2-3 cümle. Eserin bağlamı, hikayesi.",
    }),
    defineField({
      name: "sourceUrl",
      title: "Kaynak Linki",
      type: "url",
      description: "Müze sayfası, Wikipedia, vs. (opsiyonel)",
    }),
    defineField({
      name: "active",
      title: "Havuzda Aktif",
      type: "boolean",
      initialValue: true,
    }),
  ],
  preview: {
    select: {
      title: "title",
      subtitle: "artist",
      media: "image",
      active: "active",
    },
    prepare({ title, subtitle, media, active }) {
      return {
        title: `${title} ${active ? "" : "(pasif)"}`,
        subtitle,
        media,
      };
    },
  },
});
