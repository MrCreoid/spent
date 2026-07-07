"use client";

import { useMemo } from "react";
import { AnimatedMoney } from "@/components/ui/animated-number";
import { EmptyState } from "@/components/ui/empty-state";
import { ListSkeleton, Skeleton } from "@/components/ui/skeleton";
import { Pressable } from "@/components/ui/pressable";
import { ListIcon, PlusIcon } from "@/components/icons";
import { ExpenseList } from "@/features/expenses/expense-list";
import { thisWeekTotal, todayTotal } from "@/lib/analytics";
import { formatMoney } from "@/lib/currency";
import { isSameMonth } from "@/lib/dates";
import { useData } from "@/lib/data-context";
import { useSettings } from "@/lib/settings";
import { useUI } from "@/lib/ui-store";

export default function ExpensesPage() {
  const { expenses, ready } = useData();
  const currency = useSettings((s) => s.currency);
  const openSheet = useUI((s) => s.openSheet);

  const now = new Date();
  const monthName = now.toLocaleDateString(undefined, { month: "long" });

  const { monthTotal, today, week } = useMemo(() => {
    const monthRows = expenses.filter((e) =>
      isSameMonth(e.date, now.getFullYear(), now.getMonth())
    );
    return {
      monthTotal: monthRows.reduce((s, e) => s + e.amount, 0),
      today: todayTotal(expenses),
      week: thisWeekTotal(expenses),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expenses]);

  return (
    <div className="pt-6">
      <header className="px-1">
        <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-ink-3">
          {monthName}
        </p>
        {ready ? (
          <AnimatedMoney
            value={monthTotal}
            currency={currency}
            className="mt-1 block text-[40px] font-bold leading-tight tracking-tight text-ink"
          />
        ) : (
          <Skeleton className="mt-2 h-10 w-40" />
        )}
        <p className="mt-1.5 text-[14px] text-ink-2">
          <span className="tnum font-medium text-ink">
            {formatMoney(today, currency)}
          </span>{" "}
          today
          <span className="mx-2 text-ink-3">·</span>
          <span className="tnum font-medium text-ink">
            {formatMoney(week, currency)}
          </span>{" "}
          this week
        </p>
      </header>

      <div className="mt-7">
        {!ready ? (
          <ListSkeleton />
        ) : expenses.length === 0 ? (
          <EmptyState
            icon={<ListIcon size={28} />}
            title="No expenses yet"
            message="Tap the plus button and log your first expense in seconds."
            action={
              <Pressable
                onClick={() => openSheet({ kind: "expense" })}
                className="flex items-center gap-2 rounded-full bg-accent px-5 py-3 text-[15px] font-semibold text-white"
              >
                <PlusIcon size={18} strokeWidth={2.2} />
                Add expense
              </Pressable>
            }
          />
        ) : (
          <ExpenseList expenses={expenses} />
        )}
      </div>
    </div>
  );
}
