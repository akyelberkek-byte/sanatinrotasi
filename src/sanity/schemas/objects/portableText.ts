import { defineType, defineArrayMember } from "sanity";

export const portableText = defineType({
  name: "portableText",
  title: "İçerik",
  type: "array",
  of: [
    defineArrayMember({
      type: "block",
      styles: [
        { title: "Normal", value: "normal" },
        { title: "Başlık 2", value: "h2" },
        { title: "Başlık 3", value: "h3" },
        { title: "Başlık 4", value: "h4" },
        { title: "Alıntı", value: "blockquote" },
      ],
      marks: {
        decorators: [
          { title: "Kalın", value: "strong" },
          { title: "İtalik", value: "em" },
          { title: "Altı Çizili", value: "underline" },
        ],
        annotations: [
          {
            name: "link",
            type: "object",
            title: "Link",
            fields: [
              {
                name: "href",
                type: "url",
                title: "URL",
                validation: (r) =>
                  r.uri({ allowRelative: true, scheme: ["http", "https", "mailto"] }),
              },
            ],
          },
        ],
      },
    }),
    defineArrayMember({
      type: "image",
      options: { hotspot: true },
      fields: [
        {
          name: "caption",
          type: "string",
          title: "Açıklama",
        },
        {
          name: "attribution",
          type: "string",
          title: "Kaynak",
        },
      ],
    }),
    defineArrayMember({
      type: "youtube",
    }),
  ],
});
