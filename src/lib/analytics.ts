import type { CategoryId, Expense } from "./types";
import {
  addDays,
  daysInMonth,
  isSameMonth,
  monthPrefix,
  parseISODate,
  todayISO,
  toISODate,
} from "./dates";

export interface CategoryTotal {
  category: CategoryId;
  total: number;
  share: number;
  count: number;
}

export interface DayPoint {
  /** yyyy-MM-dd */
  date: string;
  day: number;
  total: number;
}

export interface MonthPoint {
  month: number;
  label: string;
  total: number;
}

export interface MonthAnalytics {
  total: number;
  count: number;
  avgPerDay: number;
  largest: Expense | null;
  byCategory: CategoryTotal[];
  topCategory: CategoryTotal | null;
  dailySeries: DayPoint[];
}

export function categoryTotals(rows: Expense[]): CategoryTotal[] {
  const total = rows.reduce((s, e) => s + e.amount, 0);
  const map = new Map<CategoryId, { total: number; count: number }>();
  for (const e of rows) {
    const entry = map.get(e.category) ?? { total: 0, count: 0 };
    entry.total += e.amount;
    entry.count += 1;
    map.set(e.category, entry);
  }
  return [...map.entries()]
    .map(([category, v]) => ({
      category,
      total: v.total,
      count: v.count,
      share: total > 0 ? v.total / total : 0,
    }))
    .sort((a, b) => b.total - a.total);
}

export function largestExpense(rows: Expense[]): Expense | null {
  let largest: Expense | null = null;
  for (const e of rows) {
    if (!largest || e.amount > largest.amount) largest = e;
  }
  return largest;
}

export function analyzeMonth(
  expenses: Expense[],
  year: number,
  month: number
): MonthAnalytics {
  const rows = expenses.filter((e) => isSameMonth(e.date, year, month));
  const total = rows.reduce((s, e) => s + e.amount, 0);
  const byCategory = categoryTotals(rows);
  const largest = largestExpense(rows);

  const now = new Date();
  const isCurrentMonth = now.getFullYear() === year && now.getMonth() === month;
  const totalDays = daysInMonth(year, month);
  const elapsedDays = isCurrentMonth ? now.getDate() : totalDays;

  const prefix = monthPrefix(year, month);
  const dailyTotals = new Map<string, number>();
  for (const e of rows) dailyTotals.set(e.date, (dailyTotals.get(e.date) ?? 0) + e.amount);
  const dailySeries: DayPoint[] = [];
  for (let d = 1; d <= (isCurrentMonth ? now.getDate() : totalDays); d++) {
    const date = `${prefix}-${String(d).padStart(2, "0")}`;
    dailySeries.push({ date, day: d, total: dailyTotals.get(date) ?? 0 });
  }

  return {
    total,
    count: rows.length,
    avgPerDay: elapsedDays > 0 ? total / elapsedDays : 0,
    largest,
    byCategory,
    topCategory: byCategory[0] ?? null,
    dailySeries,
  };
}

export function yearTotal(expenses: Expense[], year: number): number {
  const prefix = `${year}-`;
  return expenses
    .filter((e) => e.date.startsWith(prefix))
    .reduce((s, e) => s + e.amount, 0);
}

export function monthlySeries(expenses: Expense[], year: number): MonthPoint[] {
  const totals = new Array<number>(12).fill(0);
  const prefix = `${year}-`;
  for (const e of expenses) {
    if (e.date.startsWith(prefix)) {
      const m = Number(e.date.slice(5, 7)) - 1;
      if (m >= 0 && m < 12) totals[m] += e.amount;
    }
  }
  return totals.map((total, month) => ({
    month,
    label: new Date(year, month, 1).toLocaleDateString(undefined, { month: "narrow" }),
    total,
  }));
}

export interface WeekDayPoint {
  date: string;
  label: string;
  total: number;
  isToday: boolean;
}

/** Last 7 days including today */
export function weekSeries(expenses: Expense[]): WeekDayPoint[] {
  const today = todayISO();
  const start = addDays(today, -6);
  const totals = new Map<string, number>();
  for (const e of expenses) {
    if (e.date >= start && e.date <= today) {
      totals.set(e.date, (totals.get(e.date) ?? 0) + e.amount);
    }
  }
  const out: WeekDayPoint[] = [];
  for (let i = 6; i >= 0; i--) {
    const date = addDays(today, -i);
    out.push({
      date,
      label: parseISODate(date).toLocaleDateString(undefined, { weekday: "narrow" }),
      total: totals.get(date) ?? 0,
      isToday: date === today,
    });
  }
  return out;
}

export function totalsForRange(expenses: Expense[], from: string, to: string): number {
  return expenses
    .filter((e) => e.date >= from && e.date <= to)
    .reduce((s, e) => s + e.amount, 0);
}

export function todayTotal(expenses: Expense[]): number {
  const t = todayISO();
  return totalsForRange(expenses, t, t);
}

export function thisWeekTotal(expenses: Expense[]): number {
  const now = new Date();
  // Week starts Monday
  const dow = (now.getDay() + 6) % 7;
  const monday = new Date(now);
  monday.setDate(now.getDate() - dow);
  return totalsForRange(expenses, toISODate(monday), todayISO());
}
