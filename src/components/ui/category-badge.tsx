"use client";

import { CATEGORY_ICONS } from "@/components/icons";
import { CATEGORY_META } from "@/lib/categories";
import type { Category } from "@/lib/types";
import { useDarkMode } from "@/components/theme";

interface CategoryBadgeProps {
  category: Category;
  size?: number;
}

/** Rounded-square tinted category icon, Things 3 style */
export function CategoryBadge({ category, size = 40 }: CategoryBadgeProps) {
  const dark = useDarkMode();
  const meta = CATEGORY_META[category];
  const IconComponent = CATEGORY_ICONS[category];
  const idx = dark ? 1 : 0;
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-[12px]"
      style={{
        width: size,
        height: size,
        color: meta.color[idx],
        background: meta.tint[idx],
      }}
      aria-hidden="true"
    >
      <IconComponent size={Math.round(size * 0.52)} />
    </span>
  );
}
