import type { Expense, LedgerEntry, LedgerRecord } from "@/lib/types";

export type Unsubscribe = () => void;

/**
 * Storage backend for user data. Two implementations:
 * - LocalRepo (Dexie/IndexedDB) for guest mode
 * - CloudRepo (Firestore with persistent cache) when signed in
 *
 * Ledger rows come back as raw records (current or legacy shape);
 * the data layer normalizes and migrates them.
 */
export interface DataRepo {
  subscribeExpenses(cb: (expenses: Expense[]) => void): Unsubscribe;
  subscribeLedger(cb: (rows: LedgerRecord[]) => void): Unsubscribe;

  putExpense(expense: Expense): Promise<void>;
  deleteExpense(id: string): Promise<void>;

  putEntry(entry: LedgerEntry): Promise<void>;
  deleteEntry(id: string): Promise<void>;
  /** Delete a person's whole ledger */
  deleteEntries(ids: string[]): Promise<void>;

  /** Bulk write used by import and migrations */
  bulkPut(expenses: Expense[], entries: LedgerEntry[]): Promise<void>;
  /** Danger zone: wipe everything in this store */
  clearAll(): Promise<void>;
}
