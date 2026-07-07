import Dexie, { liveQuery, type Table } from "dexie";
import type { Debt, Expense } from "@/lib/types";
import type { DataRepo, Unsubscribe } from "./types";

class SpentDB extends Dexie {
  expenses!: Table<Expense, string>;
  debts!: Table<Debt, string>;

  constructor() {
    super("spent");
    this.version(1).stores({
      expenses: "id, date, category, createdAt",
      debts: "id, status, type, createdAt",
    });
  }
}

let db: SpentDB | null = null;

export function getLocalDB(): SpentDB {
  if (!db) db = new SpentDB();
  return db;
}

export class LocalRepo implements DataRepo {
  private db = getLocalDB();

  subscribeExpenses(cb: (expenses: Expense[]) => void): Unsubscribe {
    const sub = liveQuery(() => this.db.expenses.toArray()).subscribe({
      next: cb,
      error: () => cb([]),
    });
    return () => sub.unsubscribe();
  }

  subscribeDebts(cb: (debts: Debt[]) => void): Unsubscribe {
    const sub = liveQuery(() => this.db.debts.toArray()).subscribe({
      next: cb,
      error: () => cb([]),
    });
    return () => sub.unsubscribe();
  }

  async putExpense(expense: Expense) {
    await this.db.expenses.put(expense);
  }

  async deleteExpense(id: string) {
    await this.db.expenses.delete(id);
  }

  async putDebt(debt: Debt) {
    await this.db.debts.put(debt);
  }

  async deleteDebt(id: string) {
    await this.db.debts.delete(id);
  }

  async bulkPut(expenses: Expense[], debts: Debt[]) {
    await this.db.transaction("rw", this.db.expenses, this.db.debts, async () => {
      if (expenses.length) await this.db.expenses.bulkPut(expenses);
      if (debts.length) await this.db.debts.bulkPut(debts);
    });
  }

  async clearAll() {
    await this.db.transaction("rw", this.db.expenses, this.db.debts, async () => {
      await this.db.expenses.clear();
      await this.db.debts.clear();
    });
  }

  /** Snapshot used for migration to the cloud after first sign-in */
  async snapshot(): Promise<{ expenses: Expense[]; debts: Debt[] }> {
    const [expenses, debts] = await Promise.all([
      this.db.expenses.toArray(),
      this.db.debts.toArray(),
    ]);
    return { expenses, debts };
  }
}
