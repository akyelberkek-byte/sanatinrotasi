import { PortableText, PortableTextReactComponents } from "@portabletext/react";
import Image from "next/image";
import { urlFor } from "@/sanity/image";

// Sanity inline image tipi — asset expand edilmiş ya da sadece referans olabilir
type InlineImage = {
  _type?: string;
  _key?: string;
  caption?: string;
  attribution?: string;
  alt?: string;
  asset?: {
    _id?: string;
    _ref?: string;
    url?: string;
    metadata?: {
      dimensions?: { width?: number; height?: number; aspectRatio?: number };
      lqip?: string;
    };
  };
};

const components: Partial<PortableTextReactComponents> = {
  types: {
    image: ({ value }: { value: InlineImage }) => {
      // Sanity'de image bloğu henüz asset seçilmeden eklenmişse değilse bile
      // bir placeholder göstermek yerine null dön (UI temiz kalsın).
      if (!value?.asset) return null;

      // Gerçek görsel boyutlarını kullan — 16:9'a zorlama, portrait/landscape korun.
      const dim = value.asset.metadata?.dimensions;
      const width = dim?.width ?? 1600;
      const height = dim?.height ?? Math.round(width / 1.6);
      const lqip = value.asset.metadata?.lqip;

      // Sanity CDN URL — urlFor stub döndürürse raw url'e düş (expand edilmiş asset'te var).
      const src =
        urlFor(value).width(1600).fit("max").auto("format").url() ||
        value.asset.url ||
        "";
      if (!src) return null;

      return (
        <figure className="my-8">
          <Image
            src={src}
            alt={value.alt || value.caption || ""}
            width={width}
            height={height}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1000px"
            placeholder={lqip ? "blur" : "empty"}
            blurDataURL={lqip}
            className="w-full h-auto"
          />
          {value.caption && (
            <figcaption className="font-sans text-xs text-warm-gray mt-2 text-center">
              {value.caption}
              {value.attribution && <span> — {value.attribution}</span>}
            </figcaption>
          )}
        </figure>
      );
    },
    // Magazine-style pull-quote — yazıyı görsel olarak böler, ritim katar
    pullQuote: ({
      value,
    }: {
      value: { text?: string; attribution?: string };
    }) => {
      if (!value?.text) return null;
      return (
        <aside className="my-12 mx-auto max-w-2xl text-center relative px-8 md:px-12">
          <span
            aria-hidden="true"
            className="absolute left-0 -top-2 font-display text-7xl md:text-8xl text-accent leading-none select-none"
          >
            “
          </span>
          <p className="font-display text-2xl md:text-3xl font-bold text-ink leading-snug">
            {value.text}
          </p>
          <span
            aria-hidden="true"
            className="absolute right-0 -bottom-8 font-display text-7xl md:text-8xl text-accent leading-none select-none"
          >
            ”
          </span>
          {value.attribution && (
            <p className="font-sans text-[0.7rem] uppercase tracking-[0.25em] text-warm-gray mt-6">
              — {value.attribution}
            </p>
          )}
        </aside>
      );
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    youtube: ({ value }: { value: any }) => {
      if (!value?.url) return null;
      const videoId = value.url.match(
        /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]+)/
      )?.[1];
      if (!videoId) return null;
      return (
        <figure className="my-8">
          <div className="relative aspect-video">
            <iframe
              src={`https://www.youtube.com/embed/${videoId}`}
              title={value.caption || "YouTube video"}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              loading="lazy"
              className="absolute inset-0 w-full h-full"
            />
          </div>
          {value.caption && (
            <figcaption className="font-sans text-xs text-warm-gray mt-2 text-center">
              {value.caption}
            </figcaption>
          )}
        </figure>
      );
    },
  },
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function PortableRenderer({ value }: { value: any }) {
  if (!value) return null;
  return <PortableText value={value} components={components} />;
}
