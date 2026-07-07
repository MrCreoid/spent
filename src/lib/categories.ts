import type { Category } from "./types";

export interface CategoryMeta {
  id: Category;
  label: string;
  /** [light, dark] icon colors */
  color: [string, string];
  /** [light, dark] soft background tints */
  tint: [string, string];
}

export const CATEGORY_META: Record<Category, CategoryMeta> = {
  food: {
    id: "food",
    label: "Food",
    color: ["#c2410c", "#ff9f6e"],
    tint: ["rgba(234,88,12,0.10)", "rgba(255,159,110,0.13)"],
  },
  transport: {
    id: "transport",
    label: "Transport",
    color: ["#0369a1", "#6ec4ff"],
    tint: ["rgba(2,132,199,0.10)", "rgba(110,196,255,0.13)"],
  },
  college: {
    id: "college",
    label: "College",
    color: ["#4338ca", "#a5b0ff"],
    tint: ["rgba(79,70,229,0.10)", "rgba(165,176,255,0.13)"],
  },
  tech: {
    id: "tech",
    label: "Tech",
    color: ["#6d28d9", "#c4a8ff"],
    tint: ["rgba(124,58,237,0.10)", "rgba(196,168,255,0.13)"],
  },
  shopping: {
    id: "shopping",
    label: "Shopping",
    color: ["#be185d", "#ff9ecb"],
    tint: ["rgba(219,39,119,0.10)", "rgba(255,158,203,0.13)"],
  },
  entertainment: {
    id: "entertainment",
    label: "Entertainment",
    color: ["#0f766e", "#5eead4"],
    tint: ["rgba(13,148,136,0.10)", "rgba(94,234,212,0.13)"],
  },
  health: {
    id: "health",
    label: "Health",
    color: ["#b91c1c", "#ff8a8a"],
    tint: ["rgba(220,38,38,0.10)", "rgba(255,138,138,0.13)"],
  },
  gifts: {
    id: "gifts",
    label: "Gifts",
    color: ["#a16207", "#ffd166"],
    tint: ["rgba(202,138,4,0.10)", "rgba(255,209,102,0.13)"],
  },
  misc: {
    id: "misc",
    label: "Misc",
    color: ["#52525b", "#a1a1aa"],
    tint: ["rgba(82,82,91,0.10)", "rgba(161,161,170,0.13)"],
  },
};

export const CATEGORY_LIST = Object.values(CATEGORY_META);
