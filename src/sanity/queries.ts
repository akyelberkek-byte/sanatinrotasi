import { groq } from "next-sanity";

// Site Settings — tüm site metinleri
export const SITE_SETTINGS_QUERY = groq`
  *[_type == "siteSettings"][0] {
    title,
    description,
    logo,
    ogImage,
    topBarLeft,
    topBarRight,
    footerText,
    heroHeading,
    heroHeadingItalic,
    heroSubheading,
    heroDescription,
    manifestoLabel,
    manifesto,
    founderLabel,
    foundingStoryLabel,
    foundingStoryHeading,
    foundingStory,
    submitArtLabel,
    submitArtHeading,
    submitArtHeadingItalic,
    submitArtDescription,
    submitArtCtaText,
    submitArtCtaUrl,
    categoriesLabel,
    latestArticlesLabel,
    upcomingEventsLabel,
    artRoutesLabel,
    viewAllLabel,
    newsletterTitle,
    newsletterTitleItalic,
    newsletterDescription,
    newsletterNote,
    commentsRequireApproval,
    roportajlarHeading,
    roportajlarHeadingItalic,
    roportajlarDescription,
    toplulukHeading,
    toplulukHeadingItalic,
    toplulukDescription,
    emptyArticlesText,
    emptyEventsText,
    emptyRoutesText,
    socialLinks {
      instagram,
      youtube,
      pinterest,
      udemy,
      twitter
    }
  }
`;

// Founder — ana sayfa için öne çıkarılmış yazar
export const FOUNDER_QUERY = groq`
  *[_type == "author" && featured == true][0] {
    _id,
    name,
    slug,
    image,
    role,
    homepageBio,
    bio,
    social
  }
`;

// Articles
export const ARTICLES_QUERY = groq`
  *[_type == "article"] | order(publishedAt desc) [0...$limit] {
    _id,
    title,
    slug,
    publishedAt,
    excerpt,
    mainImage,
    featured,
    author-> { name, slug, image },
    category-> { title, slug, color }
  }
`;

// Ana sayfadaki "Son Yazılar" — tüm yazılardan en yeniler (featured kısıtı yok)
export const FEATURED_ARTICLES_QUERY = groq`
  *[_type == "article"] | order(publishedAt desc, _createdAt desc) [0...4] {
    _id,
    title,
    slug,
    publishedAt,
    excerpt,
    mainImage,
    author-> { name, slug },
    category-> { title, slug, color }
  }
`;

// Tüm yazıların slug'ları — 404 fallback için
export const ALL_ARTICLE_SLUGS_QUERY = groq`
  *[_type == "article" && defined(slug.current)] { "slug": slug.current }
`;

export const ARTICLE_BY_SLUG_QUERY = groq`
  *[_type == "article" && slug.current == $slug][0] {
    _id,
    _updatedAt,
    title,
    slug,
    publishedAt,
    excerpt,
    mainImage,
    body[] {
      ...,
      _type == "image" => {
        ...,
        asset->
      }
    },
    tags,
    featured,
    seo {
      metaTitle,
      metaDescription,
      ogImage
    },
    author-> { name, slug, image, role, bio, social },
    category-> { _id, title, slug, color }
  }
`;

export const ARTICLES_BY_CATEGORY_QUERY = groq`
  *[_type == "article" && category->slug.current == $categorySlug] | order(publishedAt desc) {
    _id,
    title,
    slug,
    publishedAt,
    excerpt,
    mainImage,
    author-> { name, slug },
    category-> { title, slug, color }
  }
`;

// İlgili yazılar: aynı kategorideki, mevcut yazı hariç, en yeni 3 yazı
export const RELATED_ARTICLES_QUERY = groq`
  *[_type == "article" && category._ref == $categoryId && _id != $articleId]
    | order(publishedAt desc, _createdAt desc) [0...3] {
    _id,
    title,
    slug,
    publishedAt,
    excerpt,
    mainImage,
    author-> { name, slug },
    category-> { title, slug, color }
  }
`;

// Categories
export const CATEGORIES_QUERY = groq`
  *[_type == "category"] | order(order asc) {
    _id,
    title,
    slug,
    description,
    color,
    "articleCount": count(*[_type == "article" && references(^._id)])
  }
`;

// Events
export const EVENTS_QUERY = groq`
  *[_type == "event" && date >= now()] | order(date asc) [0...$limit] {
    _id,
    title,
    slug,
    eventType,
    date,
    endDate,
    location,
    mainImage,
    price,
    featured
  }
`;

export const EVENT_BY_SLUG_QUERY = groq`
  *[_type == "event" && slug.current == $slug][0] {
    _id,
    title,
    slug,
    eventType,
    date,
    endDate,
    location,
    mainImage,
    description,
    price,
    externalUrl,
    featured,
    seo
  }
`;

// Routes
export const ROUTES_QUERY = groq`
  *[_type == "route"] | order(_createdAt desc) {
    _id,
    title,
    slug,
    subtitle,
    city,
    mainImage,
    duration,
    difficulty,
    featured,
    "stopCount": count(stops)
  }
`;

export const ROUTE_BY_SLUG_QUERY = groq`
  *[_type == "route" && slug.current == $slug][0] {
    _id,
    title,
    slug,
    subtitle,
    city,
    mainImage,
    description,
    stops[] {
      name,
      description,
      image,
      location,
      relatedArticle-> { title, slug }
    },
    duration,
    difficulty,
    tags,
    featured,
    seo
  }
`;

// Favorilerdeki yazılar (ID listesiyle) — profil sayfası için
export const ARTICLES_BY_IDS_QUERY = groq`
  *[_type == "article" && _id in $ids] {
    _id,
    title,
    slug,
    publishedAt,
    excerpt,
    mainImage,
    author-> { name, slug },
    category-> { title, slug, color }
  }
`;

// Authors
export const AUTHOR_BY_SLUG_QUERY = groq`
  *[_type == "author" && slug.current == $slug][0] {
    _id,
    name,
    slug,
    image,
    role,
    bio,
    social
  }
`;

// Comments — per article
// Limit 200 — prevents OOM / slow render on articles with spam or huge comment threads.
// UI zaten uzun thread'lerde load-more pattern'ini gerektirir; 200 makul bir üst sınır.
export const COMMENTS_BY_ARTICLE_QUERY = groq`
  *[_type == "comment" && article._ref == $articleId && approved == true]
    | order(createdAt asc) [0...200] {
    _id,
    authorName,
    authorImage,
    body,
    createdAt,
    "likeCount": coalesce(likeCount, 0),
    "likedBy": coalesce(likedBy, [])
  }
`;

// Pages
export const PAGE_BY_SLUG_QUERY = groq`
  *[_type == "page" && slug.current == $slug][0] {
    _id,
    title,
    slug,
    sectionLabel,
    headingPrefix,
    headingHighlight,
    subtitle,
    lastUpdated,
    body,
    seo
  }
`;
