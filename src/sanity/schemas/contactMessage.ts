import { defineType, defineField, defineArrayMember } from "sanity";

/**
 * İletişim formundan gelen mesajlar.
 * Mail gönderimi başarısız olsa bile mesaj burada saklanır — veri kaybı olmaz.
 */
export const contactMessage = defineType({
  name: "contactMessage",
  title: "İletişim Mesajı",
  type: "document",
  fields: [
    defineField({
      name: "name",
      title: "Ad",
      type: "string",
      readOnly: true,
    }),
    defineField({
      name: "email",
      title: "E-posta",
      type: "string",
      readOnly: true,
    }),
    defineField({
      name: "subject",
      title: "Konu",
      type: "string",
      readOnly: true,
    }),
    defineField({
      name: "message",
      title: "Mesaj",
      type: "text",
      rows: 8,
      readOnly: true,
    }),
    defineField({
      name: "externalLink",
      title: "Büyük Dosya Linki",
      type: "url",
      description: "Gönderen WeTransfer / Drive / Vimeo linki eklediyse burada görünür.",
      readOnly: true,
    }),
    defineField({
      name: "attachments",
      title: "Ekler",
      type: "array",
      readOnly: true,
      of: [
        defineArrayMember({
          name: "contactAttachment",
          title: "Ek",
          type: "object",
          fields: [
            defineField({
              name: "originalName",
              title: "Dosya Adı",
              type: "string",
            }),
            defineField({
              name: "url",
              title: "Bağlantı",
              type: "url",
            }),
            defineField({
              name: "size",
              title: "Boyut (byte)",
              type: "number",
            }),
            defineField({
              name: "mimeType",
              title: "Dosya Türü",
              type: "string",
            }),
            defineField({
              name: "asset",
              title: "Sanity Dosyası",
              type: "reference",
              to: [{ type: "sanity.imageAsset" }, { type: "sanity.fileAsset" }],
              weak: true,
            }),
          ],
          preview: {
            select: { title: "originalName", subtitle: "mimeType" },
          },
        }),
      ],
    }),
    defineField({
      name: "emailSent",
      title: "Mail Gönderildi",
      type: "boolean",
      description:
        "Kapalıysa: mesaj kaydedildi ama bildirim maili gönderilemedi. Buradan okuyabilirsiniz.",
      initialValue: false,
      readOnly: true,
    }),
    defineField({
      name: "createdAt",
      title: "Geliş Tarihi",
      type: "datetime",
      readOnly: true,
      initialValue: () => new Date().toISOString(),
    }),
    defineField({
      name: "handled",
      title: "İşlem Yapıldı",
      type: "boolean",
      description: "Bu mesajla ilgilendiyseniz işaretleyin.",
      initialValue: false,
    }),
  ],
  preview: {
    select: {
      subject: "subject",
      name: "name",
      email: "email",
      handled: "handled",
      emailSent: "emailSent",
    },
    prepare({ subject, name, email, handled, emailSent }) {
      const flags = [
        handled ? "✓" : null,
        emailSent === false ? "✉︎ gönderilemedi" : null,
      ]
        .filter(Boolean)
        .join(" · ");
      return {
        title: `${subject || "(konusuz)"}${flags ? ` — ${flags}` : ""}`,
        subtitle: [name, email].filter(Boolean).join(" · "),
      };
    },
  },
  orderings: [
    {
      title: "Yeni → Eski",
      name: "createdAtDesc",
      by: [{ field: "createdAt", direction: "desc" }],
    },
  ],
});
