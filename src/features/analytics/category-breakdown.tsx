"use client";

import { motion } from "framer-motion";
import { CategoryBadge } from "@/components/ui/category-badge";
import { useDarkMode } from "@/components/theme";
import { CATEGORY_META } from "@/lib/categories";
import { formatMoney } from "@/lib/currency";
import type { CategoryTotal } from "@/lib/analytics";

export function CategoryBreakdown({
  data,
  currency,
}: {
  data: CategoryTotal[];
  currency: string;
}) {
  const dark = useDarkMode();
  if (data.length === 0) {
    return (
      <p className="py-6 text-center text-[14px] text-ink-3">
        Nothing spent in this period.
      </p>
    );
  }
  const idx = dark ? 1 : 0;
  return (
    <ul className="flex flex-col gap-4">
      {data.map((row, i) => {
        const meta = CATEGORY_META[row.category];
        return (
          <li key={row.category} className="flex items-center gap-3">
            <CategoryBadge category={row.category} size={36} />
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <span className="truncate text-[14px] font-medium text-ink">
                  {meta.label}
                </span>
                <span className="tnum shrink-0 text-[14px] font-semibold text-ink">
                  {formatMoney(row.total, currency)}
                </span>
              </div>
              <div className="mt-1.5 flex items-center gap-2.5">
                <div className="h-[5px] flex-1 overflow-hidden rounded-full bg-card-2">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: meta.color[idx] }}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.max(row.share * 100, 2)}%` }}
                    transition={{
                      type: "spring",
                      stiffness: 200,
                      damping: 28,
                      delay: i * 0.04,
                    }}
                  />
                </div>
                <span className="tnum w-9 shrink-0 text-right text-[12px] text-ink-3">
                  {Math.round(row.share * 100)}%
                </span>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
