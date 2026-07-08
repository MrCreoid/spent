/**
 * Shared accent palette: [foreground, soft background] pairs that stay
 * readable in both themes. Used for person avatars and custom categories.
 */
export const COLOR_PAIRS = [
  ["#e0733d", "rgba(234,88,12,0.14)"],
  ["#3d9bd8", "rgba(2,132,199,0.14)"],
  ["#9d7bf5", "rgba(124,58,237,0.15)"],
  ["#e56ba5", "rgba(219,39,119,0.14)"],
  ["#3cb9a8", "rgba(13,148,136,0.15)"],
  ["#d3a13c", "rgba(202,138,4,0.15)"],
] as const;

export function pairFor(index: number | undefined, fallbackSeed: string) {
  if (index !== undefined && index >= 0 && index < COLOR_PAIRS.length) {
    return COLOR_PAIRS[index];
  }
  let hash = 0;
  for (const ch of fallbackSeed) hash = (hash * 31 + ch.charCodeAt(0)) | 0;
  return COLOR_PAIRS[Math.abs(hash) % COLOR_PAIRS.length];
}
