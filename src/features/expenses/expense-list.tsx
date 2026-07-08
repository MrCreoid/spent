"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { SwipeRow } from "@/components/ui/swipe-row";
import { CategoryBadge } from "@/components/ui/category-badge";
import { ConfirmSheet } from "@/components/ui/confirm-sheet";
import { getCategoryMeta } from "@/lib/categories";
import { formatMoney } from "@/lib/currency";
import { formatDayHeading, formatTime } from "@/lib/dates";
import { useData } from "@/lib/data-context";
import { useSettings } from "@/lib/settings";
import { useUI } from "@/lib/ui-store";
import type { Expense } from "@/lib/types";

interface DayGroup {
  date: string;
  total: number;
  items: Expense[];
}

function groupByDay(expenses: Expense[]): DayGroup[] {
  const groups: DayGroup[] = [];
  let current: DayGroup | null = null;
  for (const e of expenses) {
    if (!current || current.date !== e.date) {
      current = { date: e.date, total: 0, items: [] };
      groups.push(current);
    }
    current.items.push(e);
    current.total += e.amount;
  }
  return groups;
}

export function ExpenseList({ expenses }: { expenses: Expense[] }) {
  const { deleteExpense, customCategories } = useData();
  const currency = useSettings((s) => s.currency);
  const openSheet = useUI((s) => s.openSheet);
  const [pendingDelete, setPendingDelete] = useState<Expense | null>(null);

  const groups = useMemo(() => groupByDay(expenses), [expenses]);
  const catLabel = (id: string) => getCategoryMeta(id, customCategories).label;

  return (
    <div className="flex flex-col gap-5">
      {groups.map((group) => (
        <section key={group.date} aria-label={formatDayHeading(group.date)}>
          <div className="flex items-baseline justify-between px-1 pb-2">
            <h2 className="text-[13px] font-semibold uppercase tracking-wide text-ink-2">
              {formatDayHeading(group.date)}
            </h2>
            <span className="tnum text-[13px] font-medium text-ink-3">
              {formatMoney(group.total, currency)}
            </span>
          </div>
          <div className="overflow-hidden card-surface">
            <AnimatePresence initial={false}>
              {group.items.map((expense, i) => (
                <motion.div
                  key={expense.id}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ type: "spring", stiffness: 400, damping: 40 }}
                >
                  {i > 0 && <div className="ml-[68px] h-px bg-line" />}
                  <SwipeRow
                    onTap={() => openSheet({ kind: "expense", initial: expense })}
                    actions={[
                      {
                        label: "Edit",
                        icon: "edit",
                        onAction: () =>
                          openSheet({ kind: "expense", initial: expense }),
                      },
                      {
                        label: "Delete",
                        icon: "delete",
                        onAction: () => setPendingDelete(expense),
                      },
                    ]}
                  >
                    <div className="flex cursor-pointer items-center gap-3.5 px-4 py-3 transition-colors duration-150 hover:bg-card-2/60">
                      <CategoryBadge category={expense.category} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[15px] font-medium text-ink">
                          {expense.note || catLabel(expense.category)}
                        </p>
                        <p className="mt-0.5 text-[13px] text-ink-3">
                          {expense.note
                            ? `${catLabel(expense.category)} · ${formatTime(expense.time)}`
                            : formatTime(expense.time)}
                        </p>
                      </div>
                      <span className="tnum text-[15px] font-semibold text-ink">
                        {formatMoney(expense.amount, currency)}
                      </span>
                    </div>
                  </SwipeRow>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </section>
      ))}

      <ConfirmSheet
        open={pendingDelete !== null}
        title="Delete expense?"
        message={
          pendingDelete
            ? `${formatMoney(pendingDelete.amount, currency)} on ${catLabel(pendingDelete.category).toLowerCase()} will be removed. This can't be undone.`
            : ""
        }
        confirmLabel="Delete"
        onConfirm={() => {
          if (pendingDelete) void deleteExpense(pendingDelete.id);
          setPendingDelete(null);
        }}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
