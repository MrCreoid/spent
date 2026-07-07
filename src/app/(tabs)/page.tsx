"use client";

import { useMemo } from "react";
import Link from "next/link";
import { AnimatedMoney } from "@/components/ui/animated-number";
import { EmptyState } from "@/components/ui/empty-state";
import { ListSkeleton, Skeleton } from "@/components/ui/skeleton";
import { Pressable } from "@/components/ui/pressable";
import { CategoryBadge } from "@/components/ui/category-badge";
import {
  ChevronRightIcon,
  DebtsIcon,
  ListIcon,
  PlusIcon,
} from "@/components/icons";
import { ExpenseList } from "@/features/expenses/expense-list";
import {
  analyzeMonth,
  thisWeekTotal,
  todayTotal,
} from "@/lib/analytics";
import { CATEGORY_META } from "@/lib/categories";
import { formatMoney } from "@/lib/currency";
import { buildPeople, ledgerDashboard } from "@/lib/ledger";
import { useData } from "@/lib/data-context";
import { useSettings } from "@/lib/settings";
import { useUI } from "@/lib/ui-store";

export default function ExpensesPage() {
  const { expenses, entries, ready } = useData();
  const currency = useSettings((s) => s.currency);
  const openSheet = useUI((s) => s.openSheet);

  const now = new Date();
  const monthName = now.toLocaleDateString(undefined, { month: "long" });

  const month = useMemo(
    () => analyzeMonth(expenses, now.getFullYear(), now.getMonth()),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [expenses]
  );
  const today = useMemo(() => todayTotal(expenses), [expenses]);
  const week = useMemo(() => thisWeekTotal(expenses), [expenses]);
  const debts = useMemo(
    () => ledgerDashboard(buildPeople(entries)),
    [entries]
  );

  return (
    <div className="pt-6 lg:grid lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-10">
      {/* Main column */}
      <div>
        <header className="px-1">
          <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-ink-3">
            {monthName}
          </p>
          {ready ? (
            <AnimatedMoney
              value={month.total}
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
              icon={<ListIcon size={26} />}
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

      {/* Desktop side rail */}
      <aside className="hidden lg:block">
        <div className="sticky top-8 flex flex-col gap-3">
          <section className="rounded-card bg-card p-4">
            <h2 className="text-[13px] font-semibold uppercase tracking-wide text-ink-2">
              This month
            </h2>
            <dl className="mt-3 flex flex-col gap-2.5 text-[13.5px]">
              <div className="flex items-baseline justify-between">
                <dt className="text-ink-2">Average / day</dt>
                <dd className="tnum font-semibold text-ink">
                  {formatMoney(Math.round(month.avgPerDay), currency)}
                </dd>
              </div>
              <div className="flex items-baseline justify-between">
                <dt className="text-ink-2">Transactions</dt>
                <dd className="tnum font-semibold text-ink">{month.count}</dd>
              </div>
              <div className="flex items-baseline justify-between">
                <dt className="text-ink-2">Largest</dt>
                <dd className="tnum font-semibold text-ink">
                  {month.largest
                    ? formatMoney(month.largest.amount, currency)
                    : "—"}
                </dd>
              </div>
            </dl>
          </section>

          {month.byCategory.length > 0 && (
            <section className="rounded-card bg-card p-4">
              <div className="flex items-baseline justify-between">
                <h2 className="text-[13px] font-semibold uppercase tracking-wide text-ink-2">
                  Top categories
                </h2>
                <Link
                  href="/analytics"
                  className="text-[12px] font-medium text-accent"
                >
                  All →
                </Link>
              </div>
              <ul className="mt-3 flex flex-col gap-2.5">
                {month.byCategory.slice(0, 4).map((row) => (
                  <li key={row.category} className="flex items-center gap-2.5">
                    <CategoryBadge category={row.category} size={28} />
                    <span className="min-w-0 flex-1 truncate text-[13.5px] font-medium text-ink">
                      {CATEGORY_META[row.category].label}
                    </span>
                    <span className="tnum text-[13.5px] font-semibold text-ink">
                      {formatMoney(row.total, currency)}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <Link href="/debts" className="block">
            <section className="group rounded-card bg-card p-4 transition-colors duration-200 hover:bg-card-2/60">
              <div className="flex items-center justify-between">
                <h2 className="flex items-center gap-1.5 text-[13px] font-semibold uppercase tracking-wide text-ink-2">
                  <DebtsIcon size={14} />
                  Debts
                </h2>
                <ChevronRightIcon
                  size={14}
                  className="text-ink-3 transition-transform duration-200 group-hover:translate-x-0.5"
                />
              </div>
              <div className="mt-3 flex items-center justify-between text-[13.5px]">
                <span className="text-ink-2">Owed to you</span>
                <span className="tnum font-semibold text-positive">
                  {formatMoney(debts.owedToMe.total, currency)}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between text-[13.5px]">
                <span className="text-ink-2">You owe</span>
                <span className="tnum font-semibold text-negative">
                  {formatMoney(debts.iOwe.total, currency)}
                </span>
              </div>
            </section>
          </Link>
        </div>
      </aside>
    </div>
  );
}
