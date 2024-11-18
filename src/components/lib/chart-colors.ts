import chroma from "chroma-js";

export function getColors(count: number) {
  return chroma.scale(["black", "#bc5090", "#ff6361", "#ffa600"]).colors(count);
}
