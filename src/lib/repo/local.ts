import Dexie, { liveQuery, type Table } from "dexie";
import type {
  CustomCategory,
  Expense,
  LedgerEntry,
  LedgerRecord,
  PersonRecord,
  RecurringExpense,
} from "@/lib/types";
import type { BulkData, DataRepo, Unsubscribe } from "./types";

class SpentDB extends Dexie {
  expenses!: Table<Expense, string>;
  debts!: Table<LedgerRecord, string>;
  people!: Table<PersonRecord, string>;
  categories!: Table<CustomCategory, string>;
  recurring!: Table<RecurringExpense, string>;

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
    // v3: declared people (created before their first transaction)
    this.version(3).stores({
      expenses: "id, date, category, createdAt",
      debts: "id, personKey, date, createdAt",
      people: "id, createdAt",
    });
    // v4: custom categories + recurring (autopay) expenses
    this.version(4).stores({
      expenses: "id, date, category, createdAt",
      debts: "id, personKey, date, createdAt",
      people: "id, createdAt",
      categories: "id, createdAt",
      recurring: "id, createdAt",
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

  private subscribe<T>(
    query: () => Promise<T[]>,
    cb: (rows: T[]) => void
  ): Unsubscribe {
    const sub = liveQuery(query).subscribe({ next: cb, error: () => cb([]) });
    return () => sub.unsubscribe();
  }

  subscribeExpenses(cb: (expenses: Expense[]) => void): Unsubscribe {
    return this.subscribe(() => this.db.expenses.toArray(), cb);
  }

  subscribeLedger(cb: (rows: LedgerRecord[]) => void): Unsubscribe {
    return this.subscribe(() => this.db.debts.toArray(), cb);
  }

  subscribePeople(cb: (people: PersonRecord[]) => void): Unsubscribe {
    return this.subscribe(() => this.db.people.toArray(), cb);
  }

  subscribeCategories(cb: (categories: CustomCategory[]) => void): Unsubscribe {
    return this.subscribe(() => this.db.categories.toArray(), cb);
  }

  subscribeRecurring(cb: (recurring: RecurringExpense[]) => void): Unsubscribe {
    return this.subscribe(() => this.db.recurring.toArray(), cb);
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

  async putPerson(person: PersonRecord) {
    await this.db.people.put(person);
  }

  async deletePersonRecord(id: string) {
    await this.db.people.delete(id);
  }

  async putCategory(category: CustomCategory) {
    await this.db.categories.put(category);
  }

  async putRecurring(recurring: RecurringExpense) {
    await this.db.recurring.put(recurring);
  }

  async deleteRecurring(id: string) {
    await this.db.recurring.delete(id);
  }

  async bulkPut(data: BulkData) {
    await this.db.transaction(
      "rw",
      [this.db.expenses, this.db.debts, this.db.people, this.db.categories, this.db.recurring],
      async () => {
        if (data.expenses?.length) await this.db.expenses.bulkPut(data.expenses);
        if (data.entries?.length) await this.db.debts.bulkPut(data.entries);
        if (data.people?.length) await this.db.people.bulkPut(data.people);
        if (data.categories?.length) await this.db.categories.bulkPut(data.categories);
        if (data.recurring?.length) await this.db.recurring.bulkPut(data.recurring);
      }
    );
  }

  async clearAll() {
    await this.db.transaction(
      "rw",
      [this.db.expenses, this.db.debts, this.db.people, this.db.categories, this.db.recurring],
      async () => {
        await Promise.all([
          this.db.expenses.clear(),
          this.db.debts.clear(),
          this.db.people.clear(),
          this.db.categories.clear(),
          this.db.recurring.clear(),
        ]);
      }
    );
  }

  /** Snapshot used for migration to the cloud after first sign-in */
  async snapshot(): Promise<{
    expenses: Expense[];
    ledger: LedgerRecord[];
    people: PersonRecord[];
    categories: CustomCategory[];
    recurring: RecurringExpense[];
  }> {
    const [expenses, ledger, people, categories, recurring] = await Promise.all([
      this.db.expenses.toArray(),
      this.db.debts.toArray(),
      this.db.people.toArray(),
      this.db.categories.toArray(),
      this.db.recurring.toArray(),
    ]);
    return { expenses, ledger, people, categories, recurring };
  }
}
