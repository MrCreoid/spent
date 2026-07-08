import type {
  CustomCategory,
  Expense,
  LedgerEntry,
  LedgerRecord,
  PersonRecord,
  RecurringExpense,
} from "@/lib/types";

export type Unsubscribe = () => void;

/** Payload for bulk writes (import, migrations) */
export interface BulkData {
  expenses?: Expense[];
  entries?: LedgerEntry[];
  people?: PersonRecord[];
  categories?: CustomCategory[];
  recurring?: RecurringExpense[];
}

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
  subscribePeople(cb: (people: PersonRecord[]) => void): Unsubscribe;
  subscribeCategories(cb: (categories: CustomCategory[]) => void): Unsubscribe;
  subscribeRecurring(cb: (recurring: RecurringExpense[]) => void): Unsubscribe;

  putExpense(expense: Expense): Promise<void>;
  deleteExpense(id: string): Promise<void>;

  putEntry(entry: LedgerEntry): Promise<void>;
  deleteEntry(id: string): Promise<void>;
  /** Delete a person's whole ledger */
  deleteEntries(ids: string[]): Promise<void>;

  putPerson(person: PersonRecord): Promise<void>;
  deletePersonRecord(id: string): Promise<void>;

  putCategory(category: CustomCategory): Promise<void>;

  putRecurring(recurring: RecurringExpense): Promise<void>;
  deleteRecurring(id: string): Promise<void>;

  /** Bulk write used by import and migrations */
  bulkPut(data: BulkData): Promise<void>;
  /** Danger zone: wipe everything in this store */
  clearAll(): Promise<void>;
}
