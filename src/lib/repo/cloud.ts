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
import type { Expense, LedgerEntry, LedgerRecord } from "@/lib/types";
import type { DataRepo, Unsubscribe } from "./types";

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

  constructor(private db: Firestore, uid: string) {
    this.expensesCol = collection(db, "users", uid, "expenses");
    this.ledgerCol = collection(db, "users", uid, "debts");
  }

  subscribeExpenses(cb: (expenses: Expense[]) => void): Unsubscribe {
    return onSnapshot(
      this.expensesCol,
      (snap) => cb(snap.docs.map((d) => d.data() as Expense)),
      () => cb([])
    );
  }

  subscribeLedger(cb: (rows: LedgerRecord[]) => void): Unsubscribe {
    return onSnapshot(
      this.ledgerCol,
      (snap) => cb(snap.docs.map((d) => d.data() as LedgerRecord)),
      () => cb([])
    );
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

  async bulkPut(expenses: Expense[], entries: LedgerEntry[]) {
    const items = [
      ...expenses.map((e) => ({ col: this.expensesCol, data: clean(e), id: e.id })),
      ...entries.map((d) => ({ col: this.ledgerCol, data: clean(d), id: d.id })),
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
    for (const col of [this.expensesCol, this.ledgerCol]) {
      const snap = await getDocs(col);
      for (let i = 0; i < snap.docs.length; i += BATCH_LIMIT) {
        const batch = writeBatch(this.db);
        for (const d of snap.docs.slice(i, i + BATCH_LIMIT)) batch.delete(d.ref);
        await batch.commit();
      }
    }
  }
}
