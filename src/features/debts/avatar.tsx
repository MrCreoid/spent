"use client";

/** [foreground, soft background] pairs — readable in both themes */
export const AVATAR_PALETTE = [
  ["#e0733d", "rgba(234,88,12,0.14)"],
  ["#3d9bd8", "rgba(2,132,199,0.14)"],
  ["#9d7bf5", "rgba(124,58,237,0.15)"],
  ["#e56ba5", "rgba(219,39,119,0.14)"],
  ["#3cb9a8", "rgba(13,148,136,0.15)"],
  ["#d3a13c", "rgba(202,138,4,0.15)"],
] as const;

function hashedIndex(name: string): number {
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) | 0;
  return Math.abs(hash) % AVATAR_PALETTE.length;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase();
}

interface PersonAvatarProps {
  name: string;
  size?: number;
  /** Palette index chosen by the user; falls back to a name hash */
  color?: number;
}

export function PersonAvatar({ name, size = 40, color }: PersonAvatarProps) {
  const idx =
    color !== undefined && color >= 0 && color < AVATAR_PALETTE.length
      ? color
      : hashedIndex(name.toLowerCase());
  const [fg, bg] = AVATAR_PALETTE[idx];
  return (
    <span
      className="flex shrink-0 select-none items-center justify-center rounded-full font-semibold"
      style={{
        width: size,
        height: size,
        color: fg,
        background: bg,
        fontSize: Math.round(size * 0.36),
        boxShadow: `inset 0 0 0 1px ${fg}22`,
      }}
      aria-hidden="true"
    >
      {initials(name)}
    </span>
  );
}
