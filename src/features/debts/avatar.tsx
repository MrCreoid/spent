"use client";

import { COLOR_PAIRS, pairFor } from "@/lib/palette";

/** [foreground, soft background] pairs — readable in both themes */
export const AVATAR_PALETTE = COLOR_PAIRS;

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
  const [fg, bg] = pairFor(color, name.toLowerCase());
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
