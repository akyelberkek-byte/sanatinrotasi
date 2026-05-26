import { defineType, defineField } from "sanity";

export const newsletterSubscriber = defineType({
  name: "newsletterSubscriber",
  title: "Bülten Abonesi",
  type: "document",
  fields: [
    defineField({
      name: "email",
      title: "E-posta",
      type: "string",
      readOnly: true,
      validation: (r) => r.required(),
    }),
    defineField({
      name: "subscribedAt",
      title: "Abone Olma Tarihi",
      type: "datetime",
      readOnly: true,
      initialValue: () => new Date().toISOString(),
    }),
    defineField({
      name: "active",
      title: "Aktif",
      type: "boolean",
      description: "Kapalıysa: bu kişi listeden çıkartılmış, yeni bülten gönderilmez.",
      initialValue: true,
    }),
    defineField({
      name: "source",
      title: "Kaynak",
      type: "string",
      description: "Nereden abone oldu (örn. site-footer, kampanya-x)",
      readOnly: true,
    }),
  ],
  preview: {
    select: {
      title: "email",
      subtitle: "subscribedAt",
      active: "active",
    },
    prepare({ title, subtitle, active }) {
      const date = subtitle
        ? new Date(subtitle).toLocaleDateString("tr-TR", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })
        : "";
      return {
        title: `${title} ${active ? "" : "(pasif)"}`,
        subtitle: date,
      };
    },
  },
  orderings: [
    {
      title: "Yeni → Eski",
      name: "subscribedAtDesc",
      by: [{ field: "subscribedAt", direction: "desc" }],
    },
  ],
});
