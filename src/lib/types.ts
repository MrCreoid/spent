export const CATEGORIES = [
  "food",
  "transport",
  "college",
  "tech",
  "shopping",
  "entertainment",
  "health",
  "gifts",
  "misc",
] as const;

export type Category = (typeof CATEGORIES)[number];

/** Built-in category id or the id of a user-created category */
export type CategoryId = string;

export interface Expense {
  id: string;
  amount: number;
  category: CategoryId;
  /** Local calendar date, yyyy-MM-dd */
  date: string;
  /** Local time, HH:mm — captured automatically */
  time: string;
  note?: string;
  createdAt: number;
  updatedAt: number;
}

/**
 * Ledger entry kinds and their effect on a person's balance
 * (positive balance = they owe me):
 * - lent      → +amount  (they owe me more)
 * - borrowed  → −amount  (I owe them more)
 * - received  → −amount  (they paid me back)
 * - paid      → +amount  (I paid them back)
 */
export const ENTRY_KINDS = ["lent", "borrowed", "received", "paid"] as const;
export type EntryKind = (typeof ENTRY_KINDS)[number];

export interface LedgerEntry {
  id: string;
  /** Display name, as typed */
  person: string;
  /** Normalized name used to group entries into one ledger */
  personKey: string;
  amount: number;
  kind: EntryKind;
  reason?: string;
  note?: string;
  /** Local calendar date, yyyy-MM-dd */
  date: string;
  createdAt: number;
  updatedAt: number;
}

/**
 * A declared person. People are also derived from ledger entries;
 * a record exists so someone can be created before any transaction
 * and can carry a chosen avatar color.
 */
export interface PersonRecord {
  /** personKey — normalized name, doubles as the id */
  id: string;
  name: string;
  /** Index into the avatar palette; undefined = hashed from name */
  color?: number;
  createdAt: number;
  updatedAt: number;
}

/** A user-created expense category */
export interface CustomCategory {
  /** slug of the label, e.g. "pet-care" */
  id: string;
  label: string;
  /** Index into the shared color palette */
  color: number;
  createdAt: number;
  updatedAt: number;
}

/**
 * A monthly recurring "autopay" expense (rent, subscriptions…).
 * Applied automatically on `dayOfMonth`; missed months are backfilled
 * when the app next opens. Generated expenses use deterministic ids
 * (`rec-{id}-{yyyy-MM}`) so multiple devices never duplicate them.
 */
export interface RecurringExpense {
  id: string;
  amount: number;
  category: CategoryId;
  note?: string;
  /** 1–31; clamped to the month's last day */
  dayOfMonth: number;
  /** yyyy-MM of the last month already applied */
  lastAppliedMonth?: string;
  createdAt: number;
  updatedAt: number;
}

/** Pre-ledger schema (v1) — still understood by migration and import */
export interface LegacyDebt {
  id: string;
  person: string;
  amount: number;
  type: "lent" | "borrowed";
  reason?: string;
  date: string;
  dueDate?: string;
  status: "pending" | "settled";
  createdAt: number;
  updatedAt: number;
}

/** Raw row as it may come out of storage: current or legacy shape */
export type LedgerRecord = LedgerEntry | LegacyDebt;

export type Theme = "system" | "light" | "dark";

export interface Settings {
  theme: Theme;
  currency: string;
  lastCategory: CategoryId;
}
