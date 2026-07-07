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

export interface Expense {
  id: string;
  amount: number;
  category: Category;
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
  lastCategory: Category;
}
