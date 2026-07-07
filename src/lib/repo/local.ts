import Dexie, { liveQuery, type Table } from "dexie";
import type { Expense, LedgerEntry, LedgerRecord } from "@/lib/types";
import type { DataRepo, Unsubscribe } from "./types";

class SpentDB extends Dexie {
  expenses!: Table<Expense, string>;
  debts!: Table<LedgerRecord, string>;

  constructor() {
    super("spent");
    this.version(1).stores({
      expenses: "id, date, category, createdAt",
      debts: "id, status, type, createdAt",
    });
    // v2: debts table now holds ledger entries; rows are migrated
    // in the data layer, Dexie only needs the new indexes.
    this.version(2).stores({
      expenses: "id, date, category, createdAt",
      debts: "id, personKey, date, createdAt",
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

  subscribeLedger(cb: (rows: LedgerRecord[]) => void): Unsubscribe {
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

  async putEntry(entry: LedgerEntry) {
    await this.db.debts.put(entry);
  }

  async deleteEntry(id: string) {
    await this.db.debts.delete(id);
  }

  async deleteEntries(ids: string[]) {
    await this.db.debts.bulkDelete(ids);
  }

  async bulkPut(expenses: Expense[], entries: LedgerEntry[]) {
    await this.db.transaction("rw", this.db.expenses, this.db.debts, async () => {
      if (expenses.length) await this.db.expenses.bulkPut(expenses);
      if (entries.length) await this.db.debts.bulkPut(entries);
    });
  }

  async clearAll() {
    await this.db.transaction("rw", this.db.expenses, this.db.debts, async () => {
      await this.db.expenses.clear();
      await this.db.debts.clear();
    });
  }

  /** Snapshot used for migration to the cloud after first sign-in */
  async snapshot(): Promise<{ expenses: Expense[]; ledger: LedgerRecord[] }> {
    const [expenses, ledger] = await Promise.all([
      this.db.expenses.toArray(),
      this.db.debts.toArray(),
    ]);
    return { expenses, ledger };
  }
}
