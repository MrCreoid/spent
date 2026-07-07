"use client";

import { useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { AnimatedMoney } from "@/components/ui/animated-number";
import { EmptyState } from "@/components/ui/empty-state";
import { ListSkeleton, Skeleton } from "@/components/ui/skeleton";
import { Pressable } from "@/components/ui/pressable";
import { CategoryBadge } from "@/components/ui/category-badge";
import { Sparkline } from "@/components/ui/sparkline";
import {
  BoltIcon,
  ChevronRightIcon,
  DebtsIcon,
  ListIcon,
  PlusIcon,
} from "@/components/icons";
import { ExpenseList } from "@/features/expenses/expense-list";
import { analyzeMonth, todayTotal, totalsForRange } from "@/lib/analytics";
import { CATEGORY_META } from "@/lib/categories";
import { formatMoney } from "@/lib/currency";
import { addDays, daysInMonth, todayISO } from "@/lib/dates";
import { buildInsights, loggingStreak } from "@/lib/insights";
import { ledgerDashboard } from "@/lib/ledger";
import { useData } from "@/lib/data-context";
import { useSettings } from "@/lib/settings";
import { useUI } from "@/lib/ui-store";

function SnapshotCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="card-surface px-3.5 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-3">
        {label}
      </p>
      <p className="tnum mt-0.5 truncate text-[16px] font-bold tracking-tight text-ink">
        {value}
      </p>
      {sub && <p className="truncate text-[11.5px] text-ink-3">{sub}</p>}
    </div>
  );
}

export default function ExpensesPage() {
  const { expenses, people, ready } = useData();
  const currency = useSettings((s) => s.currency);
  const openSheet = useUI((s) => s.openSheet);

  const now = new Date();
  const today = todayISO();
  const monthName = now.toLocaleDateString(undefined, { month: "long" });

  const month = useMemo(
    () => analyzeMonth(expenses, now.getFullYear(), now.getMonth()),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [expenses]
  );
  const todaySpent = useMemo(() => todayTotal(expenses), [expenses]);
  const yesterdaySpent = useMemo(
    () => totalsForRange(expenses, addDays(today, -1), addDays(today, -1)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [expenses]
  );
  const spark = useMemo(() => {
    const days: number[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = addDays(today, -i);
      days.push(totalsForRange(expenses, d, d));
    }
    return days;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expenses]);
  const streak = useMemo(() => loggingStreak(expenses), [expenses]);
  const insight = useMemo(() => {
    const all = buildInsights(expenses, currency);
    if (all.length === 0) return null;
    const dayOfYear = Math.floor(
      (now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86_400_000
    );
    return all[dayOfYear % all.length];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expenses, currency]);
  const debts = useMemo(() => ledgerDashboard(people), [people]);

  const delta =
    yesterdaySpent > 0
      ? Math.round(((todaySpent - yesterdaySpent) / yesterdaySpent) * 100)
      : null;
  const dayOfMonth = now.getDate();
  const totalDays = daysInMonth(now.getFullYear(), now.getMonth());

  return (
    <div className="pt-6 lg:grid lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-10">
      {/* Main column */}
      <div>
        {/* Hero */}
        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 320, damping: 30 }}
          aria-label="Today's spending"
          className="relative overflow-hidden card-surface p-5"
        >
          {/* Soft accent wash */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(120% 90% at 0% 0%, var(--accent-soft) 0%, transparent 55%)",
            }}
            aria-hidden="true"
          />
          <div className="relative">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-ink-3">
                  Today
                </p>
                {ready ? (
                  <AnimatedMoney
                    value={todaySpent}
                    currency={currency}
                    className="mt-0.5 block text-[38px] font-bold leading-tight tracking-tight text-ink"
                  />
                ) : (
                  <Skeleton className="mt-2 h-9 w-32" />
                )}
                {delta !== null && ready && (
                  <p
                    className={`mt-1 text-[13px] font-medium ${
                      delta <= 0 ? "text-positive" : "text-negative"
                    }`}
                  >
                    {delta <= 0 ? "▼" : "▲"} {Math.abs(delta)}%{" "}
                    <span className="text-ink-3">vs yesterday</span>
                  </p>
                )}
              </div>
              {streak >= 2 && ready && (
                <span className="flex items-center gap-1 rounded-full bg-accent-soft px-2.5 py-1 text-[12px] font-semibold text-accent">
                  <BoltIcon size={13} />
                  {streak}-day streak
                </span>
              )}
            </div>

            {ready && spark.some((v) => v > 0) && (
              <div className="mt-3 text-accent">
                <Sparkline data={spark} height={44} />
                <div className="mt-1 flex justify-between text-[10.5px] font-medium text-ink-3">
                  <span>14 days ago</span>
                  <span>Today</span>
                </div>
              </div>
            )}

            {/* Month progress */}
            <div className="mt-4">
              <div className="flex items-baseline justify-between text-[12.5px]">
                <span className="font-medium text-ink-2">
                  {monthName}:{" "}
                  <span className="tnum font-semibold text-ink">
                    {formatMoney(month.total, currency)}
                  </span>
                </span>
                <span className="text-ink-3">
                  day {dayOfMonth} of {totalDays}
                </span>
              </div>
              <div className="mt-1.5 h-[4px] overflow-hidden rounded-full bg-card-2">
                <motion.div
                  className="h-full rounded-full bg-accent"
                  initial={{ width: 0 }}
                  animate={{ width: `${(dayOfMonth / totalDays) * 100}%` }}
                  transition={{ type: "spring", stiffness: 180, damping: 26 }}
                />
              </div>
            </div>
          </div>
        </motion.section>

        {/* Insight */}
        {insight && ready && (
          <motion.p
            key={insight}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, type: "spring", stiffness: 300, damping: 30 }}
            className="mt-3 flex items-start gap-2.5 card-surface px-4 py-3 text-[13.5px] leading-relaxed text-ink-2"
          >
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
              <BoltIcon size={11} />
            </span>
            {insight}
          </motion.p>
        )}

        {/* Monthly snapshot — the desktop rail covers this on lg */}
        {ready && month.count > 0 && (
          <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:hidden">
            <SnapshotCard
              label="Top category"
              value={
                month.topCategory
                  ? CATEGORY_META[month.topCategory.category].label
                  : "—"
              }
              sub={
                month.topCategory
                  ? formatMoney(month.topCategory.total, currency)
                  : undefined
              }
            />
            <SnapshotCard
              label="Avg / day"
              value={formatMoney(Math.round(month.avgPerDay), currency)}
            />
            <SnapshotCard
              label="Biggest"
              value={
                month.largest ? formatMoney(month.largest.amount, currency) : "—"
              }
              sub={month.largest?.note}
            />
            <SnapshotCard label="Entries" value={String(month.count)} />
          </div>
        )}

        <div className="mt-6">
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
          <section className="card-surface p-4">
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
            <section className="card-surface p-4">
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
            <section className="group card-surface p-4 transition-colors duration-200 hover:bg-card-2/60">
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
