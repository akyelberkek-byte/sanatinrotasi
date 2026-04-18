import { createImageUrlBuilder } from "@sanity/image-url";
import { client } from "./client";

const builder = createImageUrlBuilder(client);

// Chainable stub returned when no asset is available.
// Allows .width().height().url() calls to safely produce an empty string.
const makeStub = (): any => {
  const stub: any = {
    url: () => "",
  };
  const chainable = [
    "width",
    "height",
    "fit",
    "crop",
    "auto",
    "format",
    "quality",
    "dpr",
    "rect",
    "bg",
    "blur",
    "sharpen",
    "invert",
    "saturation",
    "hue",
    "focalPoint",
    "flipHorizontal",
    "flipVertical",
    "ignoreImageParams",
    "pad",
    "vanityName",
    "maxWidth",
    "maxHeight",
    "minWidth",
    "minHeight",
    "fitMax",
    "size",
  ];
  for (const m of chainable) {
    stub[m] = () => stub;
  }
  return stub;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function urlFor(source: Record<string, any> | null | undefined) {
  if (!source || !source.asset) {
    return makeStub();
  }
  return builder.image(source);
}
