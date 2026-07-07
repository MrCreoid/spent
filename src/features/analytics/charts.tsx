"use client";

import { useMemo } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { motion, useReducedMotion } from "framer-motion";
import { useDarkMode } from "@/components/theme";
import { formatMoney } from "@/lib/currency";
import { formatShortDate } from "@/lib/dates";
import type { DayPoint, MonthPoint, WeekDayPoint } from "@/lib/analytics";

function palette(dark: boolean) {
  return {
    accent: dark ? "#3395ff" : "#0071e3",
    muted: dark ? "rgba(255,255,255,0.09)" : "rgba(9,10,12,0.08)",
    label: dark ? "#62666e" : "#9a9ea6",
    tooltipBg: dark ? "#1d2024" : "#ffffff",
    tooltipText: dark ? "#f4f5f6" : "#17181a",
  };
}

interface TooltipPayload {
  active?: boolean;
  payload?: { payload: DayPoint | MonthPoint }[];
}

function ChartTooltip({
  active,
  payload,
  currency,
  labelFor,
}: TooltipPayload & {
  currency: string;
  labelFor: (p: DayPoint | MonthPoint) => string;
}) {
  const dark = useDarkMode();
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  const colors = palette(dark);
  return (
    <div
      className="rounded-xl px-3 py-2 shadow-[0_4px_16px_rgba(0,0,0,0.25)]"
      style={{ background: colors.tooltipBg, color: colors.tooltipText }}
    >
      <p className="text-[11px] font-medium opacity-60">{labelFor(point)}</p>
      <p className="tnum text-[14px] font-semibold">
        {formatMoney(point.total, currency)}
      </p>
    </div>
  );
}

/** Apple Health style area chart of daily spending in a month */
export function DailyTrendChart({
  data,
  currency,
}: {
  data: DayPoint[];
  currency: string;
}) {
  const dark = useDarkMode();
  const reduceMotion = useReducedMotion();
  const colors = palette(dark);
  const ticks = useMemo(() => {
    const last = data.length;
    if (last <= 7) return data.map((d) => d.day);
    return [1, Math.round(last / 3), Math.round((2 * last) / 3), last];
  }, [data]);

  return (
    <div className="h-[180px] w-full" role="img" aria-label="Daily spending trend">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 4, left: 4, bottom: 0 }}>
          <defs>
            <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={colors.accent} stopOpacity={0.22} />
              <stop offset="100%" stopColor={colors.accent} stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="day"
            ticks={ticks}
            tickLine={false}
            axisLine={false}
            tick={{ fill: colors.label, fontSize: 11 }}
            dy={4}
          />
          <YAxis hide domain={[0, "dataMax"]} />
          <Tooltip
            cursor={{ stroke: colors.muted, strokeWidth: 1 }}
            content={
              <ChartTooltip
                currency={currency}
                labelFor={(p) => formatShortDate((p as DayPoint).date)}
              />
            }
          />
          <Area
            type="monotone"
            dataKey="total"
            stroke={colors.accent}
            strokeWidth={2.5}
            fill="url(#trendFill)"
            isAnimationActive={!reduceMotion}
            animationDuration={700}
            animationEasing="ease-out"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Twelve-month bar chart; the selected month is highlighted */
export function MonthlyBarChart({
  data,
  currency,
  activeMonth,
}: {
  data: MonthPoint[];
  currency: string;
  activeMonth: number;
}) {
  const dark = useDarkMode();
  const reduceMotion = useReducedMotion();
  const colors = palette(dark);

  return (
    <div className="h-[180px] w-full" role="img" aria-label="Monthly spending trend">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 4, left: 4, bottom: 0 }}>
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tick={{ fill: colors.label, fontSize: 11 }}
            dy={4}
            interval={0}
          />
          <YAxis hide domain={[0, "dataMax"]} />
          <Tooltip
            cursor={{ fill: colors.muted, radius: 8 }}
            content={
              <ChartTooltip
                currency={currency}
                labelFor={(p) =>
                  new Date(2000, (p as MonthPoint).month, 1).toLocaleDateString(
                    undefined,
                    { month: "long" }
                  )
                }
              />
            }
          />
          <Bar
            dataKey="total"
            radius={[6, 6, 6, 6]}
            isAnimationActive={!reduceMotion}
            animationDuration={600}
            animationEasing="ease-out"
          >
            {data.map((point) => (
              <Cell
                key={point.month}
                fill={point.month === activeMonth ? colors.accent : colors.muted}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Last-7-days bars, hand-animated for a soft spring feel */
export function WeekBars({
  data,
  currency,
}: {
  data: WeekDayPoint[];
  currency: string;
}) {
  const max = Math.max(...data.map((d) => d.total), 1);
  return (
    <div className="flex h-[132px] items-end gap-2" role="img" aria-label="Last 7 days spending">
      {data.map((day) => (
        <div key={day.date} className="flex flex-1 flex-col items-center gap-1.5">
          <span className="tnum text-[10px] font-medium text-ink-3">
            {day.total > 0 ? formatMoney(day.total, currency, { compact: true }) : ""}
          </span>
          <div className="flex h-[76px] w-full items-end">
            <motion.div
              className="w-full rounded-lg"
              style={{
                background: day.isToday ? "var(--accent)" : "var(--card-2)",
                minHeight: 4,
              }}
              initial={{ height: 4 }}
              animate={{ height: `${Math.max((day.total / max) * 100, 5)}%` }}
              transition={{ type: "spring", stiffness: 240, damping: 28 }}
            />
          </div>
          <span
            className={`text-[11px] font-medium ${
              day.isToday ? "text-accent" : "text-ink-3"
            }`}
          >
            {day.label}
          </span>
        </div>
      ))}
    </div>
  );
}
