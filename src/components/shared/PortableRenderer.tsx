import { PortableText, PortableTextReactComponents } from "@portabletext/react";
import Image from "next/image";
import { urlFor } from "@/sanity/image";

const components: Partial<PortableTextReactComponents> = {
  types: {
    image: ({ value }: any) => {
      if (!value?.asset) return null;
      return (
        <figure className="my-8">
          <Image
            src={urlFor(value).width(1200).url()}
            alt={value.caption || ""}
            width={1200}
            height={675}
            className="w-full"
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
    youtube: ({ value }: any) => {
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

export default function PortableRenderer({ value }: { value: any }) {
  if (!value) return null;
  return <PortableText value={value} components={components} />;
}
