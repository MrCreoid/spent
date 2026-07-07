"use client";

import { useMemo, useState, type ReactNode } from "react";
import { Segmented } from "@/components/ui/segmented";
import { AnimatedMoney } from "@/components/ui/animated-number";
import { Pressable } from "@/components/ui/pressable";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/icons";
import {
  DailyTrendChart,
  MonthlyBarChart,
  WeekBars,
} from "@/features/analytics/charts";
import { CategoryBreakdown } from "@/features/analytics/category-breakdown";
import {
  analyzeMonth,
  categoryTotals,
  largestExpense,
  monthlySeries,
  weekSeries,
  yearTotal,
} from "@/lib/analytics";
import { CATEGORY_META } from "@/lib/categories";
import { formatMoney } from "@/lib/currency";
import { monthLabel } from "@/lib/dates";
import { useData } from "@/lib/data-context";
import { useSettings } from "@/lib/settings";
import { haptic } from "@/lib/haptics";

function Card({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <section className="rounded-card bg-card p-4">
      {title && (
        <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-wide text-ink-2">
          {title}
        </h2>
      )}
      {children}
    </section>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-card bg-card px-4 py-3.5">
      <p className="text-[12px] font-semibold uppercase tracking-wide text-ink-3">
        {label}
      </p>
      <p className="tnum mt-1 truncate text-[20px] font-bold tracking-tight text-ink">
        {value}
      </p>
      {sub && <p className="mt-0.5 truncate text-[12px] text-ink-3">{sub}</p>}
    </div>
  );
}

export default function AnalyticsPage() {
  const { expenses, ready } = useData();
  const currency = useSettings((s) => s.currency);

  const now = new Date();
  const [mode, setMode] = useState<"month" | "year">("month");
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

  const isCurrentPeriod =
    mode === "month"
      ? year === now.getFullYear() && month === now.getMonth()
      : year === now.getFullYear();

  const shift = (delta: number) => {
    haptic(4);
    if (mode === "year") {
      setYear((y) => y + delta);
      return;
    }
    const d = new Date(year, month + delta, 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth());
  };

  const monthStats = useMemo(
    () => analyzeMonth(expenses, year, month),
    [expenses, year, month]
  );
  const yearStats = useMemo(() => {
    const rows = expenses.filter((e) => e.date.startsWith(`${year}-`));
    return {
      total: yearTotal(expenses, year),
      count: rows.length,
      byCategory: categoryTotals(rows),
      largest: largestExpense(rows),
      series: monthlySeries(expenses, year),
    };
  }, [expenses, year]);
  const week = useMemo(() => weekSeries(expenses), [expenses]);

  const periodTotal = mode === "month" ? monthStats.total : yearStats.total;
  const periodLabel = mode === "month" ? monthLabel(year, month) : String(year);

  return (
    <div className="pt-6">
      <header className="px-1">
        <h1 className="text-[28px] font-bold tracking-tight text-ink">Analytics</h1>
      </header>

      <div className="mt-4 flex items-center justify-between gap-3">
        <Segmented
          ariaLabel="Period"
          className="w-[150px]"
          options={[
            { value: "month", label: "Month" },
            { value: "year", label: "Year" },
          ]}
          value={mode}
          onChange={setMode}
        />
        <div className="flex items-center gap-1">
          <Pressable
            aria-label={mode === "month" ? "Previous month" : "Previous year"}
            onClick={() => shift(-1)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-card-2 text-ink-2"
          >
            <ChevronLeftIcon size={17} />
          </Pressable>
          <span className="min-w-[92px] text-center text-[14px] font-semibold text-ink">
            {periodLabel}
          </span>
          <Pressable
            aria-label={mode === "month" ? "Next month" : "Next year"}
            onClick={() => shift(1)}
            disabled={isCurrentPeriod}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-card-2 text-ink-2 disabled:opacity-30"
          >
            <ChevronRightIcon size={17} />
          </Pressable>
        </div>
      </div>

      <div className="mt-5 px-1">
        <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-ink-3">
          Total spent
        </p>
        {ready ? (
          <AnimatedMoney
            value={periodTotal}
            currency={currency}
            className="mt-1 block text-[36px] font-bold leading-tight tracking-tight text-ink"
          />
        ) : (
          <Skeleton className="mt-2 h-9 w-36" />
        )}
      </div>

      <div className="mt-5 flex flex-col gap-3">
        {mode === "month" ? (
          <>
            <Card title="Daily trend">
              <DailyTrendChart data={monthStats.dailySeries} currency={currency} />
            </Card>
            <Card title="Last 7 days">
              <WeekBars data={week} currency={currency} />
            </Card>
            <div className="grid grid-cols-2 gap-3">
              <Stat
                label="Avg / day"
                value={formatMoney(Math.round(monthStats.avgPerDay), currency)}
              />
              <Stat label="Transactions" value={String(monthStats.count)} />
              <Stat
                label="Largest"
                value={
                  monthStats.largest
                    ? formatMoney(monthStats.largest.amount, currency)
                    : "—"
                }
                sub={
                  monthStats.largest
                    ? monthStats.largest.note ||
                      CATEGORY_META[monthStats.largest.category].label
                    : undefined
                }
              />
              <Stat
                label="Top category"
                value={
                  monthStats.topCategory
                    ? CATEGORY_META[monthStats.topCategory.category].label
                    : "—"
                }
                sub={
                  monthStats.topCategory
                    ? formatMoney(monthStats.topCategory.total, currency)
                    : undefined
                }
              />
            </div>
            <Card title="Categories">
              <CategoryBreakdown data={monthStats.byCategory} currency={currency} />
            </Card>
          </>
        ) : (
          <>
            <Card title="Monthly trend">
              <MonthlyBarChart
                data={yearStats.series}
                currency={currency}
                activeMonth={isCurrentPeriod ? now.getMonth() : -1}
              />
            </Card>
            <div className="grid grid-cols-2 gap-3">
              <Stat label="Transactions" value={String(yearStats.count)} />
              <Stat
                label="Largest"
                value={
                  yearStats.largest
                    ? formatMoney(yearStats.largest.amount, currency)
                    : "—"
                }
                sub={
                  yearStats.largest
                    ? yearStats.largest.note ||
                      CATEGORY_META[yearStats.largest.category].label
                    : undefined
                }
              />
            </div>
            <Card title="Categories">
              <CategoryBreakdown data={yearStats.byCategory} currency={currency} />
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
