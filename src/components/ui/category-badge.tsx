"use client";

import { CATEGORY_ICONS, TagIcon } from "@/components/icons";
import { getCategoryMeta, isBuiltInCategory } from "@/lib/categories";
import type { CategoryId } from "@/lib/types";
import { useDarkMode } from "@/components/theme";
import { useData } from "@/lib/data-context";

interface CategoryBadgeProps {
  category: CategoryId;
  size?: number;
}

/** Rounded-square tinted category icon; custom categories get the tag icon */
export function CategoryBadge({ category, size = 40 }: CategoryBadgeProps) {
  const dark = useDarkMode();
  const { customCategories } = useData();
  const meta = getCategoryMeta(category, customCategories);
  const IconComponent = isBuiltInCategory(category)
    ? CATEGORY_ICONS[category]
    : TagIcon;
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
