import { article } from "./article";
import { author } from "./author";
import { category } from "./category";
import { comment } from "./comment";
import { event } from "./event";
import { page } from "./page";
import { route } from "./route";
import { siteSettings } from "./siteSettings";
import { portableText } from "./objects/portableText";
import { seo } from "./objects/seo";
import { youtube } from "./objects/youtube";

export const schemaTypes = [
  // Documents
  article,
  author,
  category,
  comment,
  event,
  page,
  route,
  siteSettings,
  // Objects
  portableText,
  seo,
  youtube,
];
