import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  setDoc,
  writeBatch,
  getDocs,
  type CollectionReference,
  type Firestore,
} from "firebase/firestore";
import type {
  CustomCategory,
  Expense,
  LedgerEntry,
  LedgerRecord,
  PersonRecord,
  RecurringExpense,
} from "@/lib/types";
import type { BulkData, DataRepo, Unsubscribe } from "./types";

/** Strip undefined values — Firestore rejects them */
function clean<T extends object>(value: T): T {
  return Object.fromEntries(
    Object.entries(value).filter(([, v]) => v !== undefined)
  ) as T;
}

const BATCH_LIMIT = 450; // Firestore caps batches at 500 writes

export class CloudRepo implements DataRepo {
  private expensesCol: CollectionReference;
  private ledgerCol: CollectionReference;
  private peopleCol: CollectionReference;
  private categoriesCol: CollectionReference;
  private recurringCol: CollectionReference;

  constructor(private db: Firestore, uid: string) {
    this.expensesCol = collection(db, "users", uid, "expenses");
    this.ledgerCol = collection(db, "users", uid, "debts");
    this.peopleCol = collection(db, "users", uid, "people");
    this.categoriesCol = collection(db, "users", uid, "categories");
    this.recurringCol = collection(db, "users", uid, "recurring");
  }

  private subscribeCol<T>(
    col: CollectionReference,
    cb: (rows: T[]) => void
  ): Unsubscribe {
    return onSnapshot(
      col,
      (snap) => cb(snap.docs.map((d) => d.data() as T)),
      () => cb([])
    );
  }

  subscribeExpenses(cb: (expenses: Expense[]) => void): Unsubscribe {
    return this.subscribeCol(this.expensesCol, cb);
  }

  subscribeLedger(cb: (rows: LedgerRecord[]) => void): Unsubscribe {
    return this.subscribeCol(this.ledgerCol, cb);
  }

  subscribePeople(cb: (people: PersonRecord[]) => void): Unsubscribe {
    return this.subscribeCol(this.peopleCol, cb);
  }

  subscribeCategories(cb: (categories: CustomCategory[]) => void): Unsubscribe {
    return this.subscribeCol(this.categoriesCol, cb);
  }

  subscribeRecurring(cb: (recurring: RecurringExpense[]) => void): Unsubscribe {
    return this.subscribeCol(this.recurringCol, cb);
  }

  async putExpense(expense: Expense) {
    await setDoc(doc(this.expensesCol, expense.id), clean(expense));
  }

  async deleteExpense(id: string) {
    await deleteDoc(doc(this.expensesCol, id));
  }

  async putEntry(entry: LedgerEntry) {
    await setDoc(doc(this.ledgerCol, entry.id), clean(entry));
  }

  async deleteEntry(id: string) {
    await deleteDoc(doc(this.ledgerCol, id));
  }

  async deleteEntries(ids: string[]) {
    for (let i = 0; i < ids.length; i += BATCH_LIMIT) {
      const batch = writeBatch(this.db);
      for (const id of ids.slice(i, i + BATCH_LIMIT)) {
        batch.delete(doc(this.ledgerCol, id));
      }
      await batch.commit();
    }
  }

  async putPerson(person: PersonRecord) {
    await setDoc(doc(this.peopleCol, person.id), clean(person));
  }

  async deletePersonRecord(id: string) {
    await deleteDoc(doc(this.peopleCol, id));
  }

  async putCategory(category: CustomCategory) {
    await setDoc(doc(this.categoriesCol, category.id), clean(category));
  }

  async putRecurring(recurring: RecurringExpense) {
    await setDoc(doc(this.recurringCol, recurring.id), clean(recurring));
  }

  async deleteRecurring(id: string) {
    await deleteDoc(doc(this.recurringCol, id));
  }

  async bulkPut(data: BulkData) {
    const items = [
      ...(data.expenses ?? []).map((e) => ({ col: this.expensesCol, data: clean(e), id: e.id })),
      ...(data.entries ?? []).map((d) => ({ col: this.ledgerCol, data: clean(d), id: d.id })),
      ...(data.people ?? []).map((p) => ({ col: this.peopleCol, data: clean(p), id: p.id })),
      ...(data.categories ?? []).map((c) => ({ col: this.categoriesCol, data: clean(c), id: c.id })),
      ...(data.recurring ?? []).map((r) => ({ col: this.recurringCol, data: clean(r), id: r.id })),
    ];
    for (let i = 0; i < items.length; i += BATCH_LIMIT) {
      const batch = writeBatch(this.db);
      for (const item of items.slice(i, i + BATCH_LIMIT)) {
        batch.set(doc(item.col, item.id), item.data);
      }
      await batch.commit();
    }
  }

  async clearAll() {
    const cols = [
      this.expensesCol,
      this.ledgerCol,
      this.peopleCol,
      this.categoriesCol,
      this.recurringCol,
    ];
    for (const col of cols) {
      const snap = await getDocs(col);
      for (let i = 0; i < snap.docs.length; i += BATCH_LIMIT) {
        const batch = writeBatch(this.db);
        for (const d of snap.docs.slice(i, i + BATCH_LIMIT)) batch.delete(d.ref);
        await batch.commit();
      }
    }
  }
}
