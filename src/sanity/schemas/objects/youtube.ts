import { defineType, defineField } from "sanity";

export const youtube = defineType({
  name: "youtube",
  title: "YouTube Video",
  type: "object",
  fields: [
    defineField({
      name: "url",
      title: "YouTube URL",
      type: "url",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "caption",
      title: "Açıklama",
      type: "string",
    }),
  ],
  preview: {
    select: { title: "caption", url: "url" },
    prepare({ title, url }) {
      return {
        title: title || "YouTube Video",
        subtitle: url,
      };
    },
  },
});
