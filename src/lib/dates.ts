const pad = (n: number) => String(n).padStart(2, "0");

/** Local calendar date as yyyy-MM-dd */
export function toISODate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export const todayISO = () => toISODate(new Date());

export function nowTime(): string {
  const d = new Date();
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Parse yyyy-MM-dd as a local-midnight Date */
export function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(iso: string, days: number): string {
  const d = parseISODate(iso);
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

/** "Today" / "Yesterday" / "Mon, 4 Jul" */
export function formatDayHeading(iso: string): string {
  const today = todayISO();
  if (iso === today) return "Today";
  if (iso === addDays(today, -1)) return "Yesterday";
  const d = parseISODate(iso);
  const opts: Intl.DateTimeFormatOptions =
    d.getFullYear() === new Date().getFullYear()
      ? { weekday: "short", day: "numeric", month: "short" }
      : { day: "numeric", month: "short", year: "numeric" };
  return d.toLocaleDateString(undefined, opts);
}

/** "4 Jul" or "4 Jul 2025" if a different year */
export function formatShortDate(iso: string): string {
  const d = parseISODate(iso);
  const opts: Intl.DateTimeFormatOptions =
    d.getFullYear() === new Date().getFullYear()
      ? { day: "numeric", month: "short" }
      : { day: "numeric", month: "short", year: "numeric" };
  return d.toLocaleDateString(undefined, opts);
}

/** "12:41 pm" */
export function formatTime(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const d = new Date();
  d.setHours(h, m);
  return d
    .toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })
    .toLowerCase();
}

export function monthLabel(year: number, month: number): string {
  return new Date(year, month, 1).toLocaleDateString(undefined, {
    month: "long",
    year: year === new Date().getFullYear() ? undefined : "numeric",
  });
}

export function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

/** yyyy-MM prefix for a given year/month */
export function monthPrefix(year: number, month: number): string {
  return `${year}-${pad(month + 1)}`;
}

export function isSameMonth(iso: string, year: number, month: number): boolean {
  return iso.startsWith(monthPrefix(year, month));
}

export function isOverdue(dueDate: string | undefined): boolean {
  return !!dueDate && dueDate < todayISO();
}
