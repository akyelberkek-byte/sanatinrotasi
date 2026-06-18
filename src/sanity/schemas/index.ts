import { article } from "./article";
import { author } from "./author";
import { category } from "./category";
import { comment } from "./comment";
import { dailyArtwork } from "./dailyArtwork";
import { event } from "./event";
import { newsletterSubscriber } from "./newsletterSubscriber";
import { page } from "./page";
import { route } from "./route";
import { series } from "./series";
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
  dailyArtwork,
  event,
  newsletterSubscriber,
  page,
  route,
  series,
  siteSettings,
  // Objects
  portableText,
  seo,
  youtube,
];
