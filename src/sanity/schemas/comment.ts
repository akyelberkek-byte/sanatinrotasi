import { defineType, defineField } from "sanity";

export const comment = defineType({
  name: "comment",
  title: "Yorum",
  type: "document",
  fields: [
    defineField({
      name: "article",
      title: "Yazı",
      type: "reference",
      to: [{ type: "article" }],
      validation: (r) => r.required(),
    }),
    defineField({
      name: "authorName",
      title: "Yorum Yazan",
      type: "string",
      validation: (r) => r.required().max(120),
    }),
    defineField({
      name: "authorEmail",
      title: "E-posta",
      type: "string",
      description: "Clerk hesabından gelir, herkese görünmez",
    }),
    defineField({
      name: "authorId",
      title: "Clerk Kullanıcı ID",
      type: "string",
      readOnly: true,
    }),
    defineField({
      name: "authorImage",
      title: "Profil Fotoğrafı URL",
      type: "url",
      readOnly: true,
    }),
    defineField({
      name: "body",
      title: "Yorum İçeriği",
      type: "text",
      rows: 4,
      validation: (r) => r.required().min(1).max(2000),
    }),
    defineField({
      name: "approved",
      title: "Onaylandı",
      type: "boolean",
      description: "Kapalıysa sitede görünmez (moderasyon)",
      initialValue: true,
    }),
    defineField({
      name: "createdAt",
      title: "Oluşturulma Tarihi",
      type: "datetime",
      readOnly: true,
      initialValue: () => new Date().toISOString(),
    }),
  ],
  preview: {
    select: {
      authorName: "authorName",
      body: "body",
      articleTitle: "article.title",
      approved: "approved",
    },
    prepare({ authorName, body, articleTitle, approved }) {
      return {
        title: `${authorName} ${!approved ? "(onaysız)" : ""}`,
        subtitle: `${articleTitle ? `"${articleTitle}" — ` : ""}${
          body ? body.slice(0, 80) : ""
        }`,
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
