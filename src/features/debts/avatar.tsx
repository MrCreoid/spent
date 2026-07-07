"use client";

const AVATAR_COLORS = [
  ["#c2410c", "rgba(234,88,12,0.12)"],
  ["#0369a1", "rgba(2,132,199,0.12)"],
  ["#6d28d9", "rgba(124,58,237,0.12)"],
  ["#be185d", "rgba(219,39,119,0.12)"],
  ["#0f766e", "rgba(13,148,136,0.12)"],
  ["#a16207", "rgba(202,138,4,0.12)"],
] as const;

function colorsFor(name: string) {
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) | 0;
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase();
}

export function PersonAvatar({ name, size = 40 }: { name: string; size?: number }) {
  const [fg, bg] = colorsFor(name.toLowerCase());
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full font-semibold"
      style={{
        width: size,
        height: size,
        color: fg,
        background: bg,
        fontSize: Math.round(size * 0.36),
      }}
      aria-hidden="true"
    >
      {initials(name)}
    </span>
  );
}
