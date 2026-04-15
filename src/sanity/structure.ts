import type { StructureResolver } from "sanity/structure";

export const structure: StructureResolver = (S) =>
  S.list()
    .title("Sanatın Rotası")
    .items([
      // Site Ayarları (singleton)
      S.listItem()
        .title("Site Ayarları")
        .id("siteSettings")
        .child(S.document().schemaType("siteSettings").documentId("siteSettings")),

      S.divider(),

      // İçerik
      S.listItem()
        .title("Yazılar")
        .schemaType("article")
        .child(S.documentTypeList("article").title("Yazılar")),

      S.listItem()
        .title("Kategoriler")
        .schemaType("category")
        .child(S.documentTypeList("category").title("Kategoriler")),

      S.listItem()
        .title("Sanat Rotaları")
        .schemaType("route")
        .child(S.documentTypeList("route").title("Sanat Rotaları")),

      S.listItem()
        .title("Etkinlikler")
        .schemaType("event")
        .child(S.documentTypeList("event").title("Etkinlikler")),

      S.divider(),

      // Yönetim
      S.listItem()
        .title("Yazarlar")
        .schemaType("author")
        .child(S.documentTypeList("author").title("Yazarlar")),

      S.listItem()
        .title("Sayfalar")
        .schemaType("page")
        .child(S.documentTypeList("page").title("Sayfalar")),
    ]);
