import type { Expense } from "./types";
import { CATEGORY_META } from "./categories";
import { addDays, todayISO, monthPrefix, parseISODate } from "./dates";
import { categoryTotals, totalsForRange } from "./analytics";
import { formatMoney } from "./currency";

/** Consecutive days with at least one logged expense, anchored on today/yesterday */
export function loggingStreak(expenses: Expense[]): number {
  if (expenses.length === 0) return 0;
  const days = new Set(expenses.map((e) => e.date));
  const today = todayISO();
  let cursor = days.has(today) ? today : addDays(today, -1);
  if (!days.has(cursor)) return 0;
  let streak = 0;
  while (days.has(cursor)) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

/**
 * Plain-statistics insights, most interesting first. The home screen
 * rotates through them day by day.
 */
export function buildInsights(expenses: Expense[], currency: string): string[] {
  const insights: string[] = [];
  const today = todayISO();
  const now = new Date();

  // 1. Last 7 days vs the 7 before
  const thisWeek = totalsForRange(expenses, addDays(today, -6), today);
  const lastWeek = totalsForRange(expenses, addDays(today, -13), addDays(today, -7));
  if (lastWeek > 0 && thisWeek > 0) {
    const change = Math.round(((thisWeek - lastWeek) / lastWeek) * 100);
    if (Math.abs(change) >= 5) {
      insights.push(
        change < 0
          ? `You've spent ${-change}% less than the previous week. Keep it up.`
          : `Spending is up ${change}% on the previous week.`
      );
    }
  }

  // 2. Dominant category this month
  const prefix = monthPrefix(now.getFullYear(), now.getMonth());
  const monthRows = expenses.filter((e) => e.date.startsWith(prefix));
  const monthTotal = monthRows.reduce((s, e) => s + e.amount, 0);
  const byCategory = categoryTotals(monthRows);
  if (byCategory.length > 1 && byCategory[0].share >= 0.3) {
    insights.push(
      `${CATEGORY_META[byCategory[0].category].label} is ${Math.round(
        byCategory[0].share * 100
      )}% of this month's spending.`
    );
  }

  // 3. Most expensive weekday over the last 8 weeks
  const since = addDays(today, -55);
  const recent = expenses.filter((e) => e.date >= since);
  if (recent.length >= 14) {
    const byDay = new Array<number>(7).fill(0);
    for (const e of recent) byDay[parseISODate(e.date).getDay()] += e.amount;
    const max = Math.max(...byDay);
    const total = byDay.reduce((s, v) => s + v, 0);
    if (total > 0 && max / total >= 0.22) {
      const weekday = new Date(2024, 0, 7 + byDay.indexOf(max)) // a known Sunday + offset
        .toLocaleDateString(undefined, { weekday: "long" });
      insights.push(`${weekday}s are usually your most expensive day.`);
    }
  }

  // 4. Category rising vs last month
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastPrefix = monthPrefix(lastMonth.getFullYear(), lastMonth.getMonth());
  const lastRows = expenses.filter((e) => e.date.startsWith(lastPrefix));
  const lastByCategory = new Map(
    categoryTotals(lastRows).map((c) => [c.category, c.total])
  );
  for (const row of byCategory) {
    const before = lastByCategory.get(row.category) ?? 0;
    if (before >= 100 && row.total >= before * 1.3) {
      insights.push(
        `${CATEGORY_META[row.category].label} spending is up ${Math.round(
          (row.total / before - 1) * 100
        )}% on last month.`
      );
      break;
    }
  }

  // 5. Biggest purchase this month
  const largest = monthRows.reduce<Expense | null>(
    (best, e) => (!best || e.amount > best.amount ? e : best),
    null
  );
  if (largest && monthTotal > 0 && largest.amount / monthTotal >= 0.15) {
    insights.push(
      `Your biggest expense this month: ${formatMoney(largest.amount, currency)}${
        largest.note ? ` on ${largest.note.toLowerCase()}` : ""
      }.`
    );
  }

  return insights;
}
