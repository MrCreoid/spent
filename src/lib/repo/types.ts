import type { Debt, Expense } from "@/lib/types";

export type Unsubscribe = () => void;

/**
 * Storage backend for user data. Two implementations:
 * - LocalRepo (Dexie/IndexedDB) for guest mode
 * - CloudRepo (Firestore with persistent cache) when signed in
 */
export interface DataRepo {
  subscribeExpenses(cb: (expenses: Expense[]) => void): Unsubscribe;
  subscribeDebts(cb: (debts: Debt[]) => void): Unsubscribe;

  putExpense(expense: Expense): Promise<void>;
  deleteExpense(id: string): Promise<void>;

  putDebt(debt: Debt): Promise<void>;
  deleteDebt(id: string): Promise<void>;

  /** Bulk write used by import and local→cloud migration */
  bulkPut(expenses: Expense[], debts: Debt[]): Promise<void>;
  /** Danger zone: wipe everything in this store */
  clearAll(): Promise<void>;
}
