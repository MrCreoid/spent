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
import type { Debt, Expense } from "@/lib/types";
import type { DataRepo, Unsubscribe } from "./types";

/** Strip undefined values — Firestore rejects them */
function clean<T extends object>(value: T): T {
  return Object.fromEntries(
    Object.entries(value).filter(([, v]) => v !== undefined)
  ) as T;
}

export class CloudRepo implements DataRepo {
  private expensesCol: CollectionReference;
  private debtsCol: CollectionReference;

  constructor(private db: Firestore, uid: string) {
    this.expensesCol = collection(db, "users", uid, "expenses");
    this.debtsCol = collection(db, "users", uid, "debts");
  }

  subscribeExpenses(cb: (expenses: Expense[]) => void): Unsubscribe {
    return onSnapshot(
      this.expensesCol,
      (snap) => cb(snap.docs.map((d) => d.data() as Expense)),
      () => cb([])
    );
  }

  subscribeDebts(cb: (debts: Debt[]) => void): Unsubscribe {
    return onSnapshot(
      this.debtsCol,
      (snap) => cb(snap.docs.map((d) => d.data() as Debt)),
      () => cb([])
    );
  }

  async putExpense(expense: Expense) {
    await setDoc(doc(this.expensesCol, expense.id), clean(expense));
  }

  async deleteExpense(id: string) {
    await deleteDoc(doc(this.expensesCol, id));
  }

  async putDebt(debt: Debt) {
    await setDoc(doc(this.debtsCol, debt.id), clean(debt));
  }

  async deleteDebt(id: string) {
    await deleteDoc(doc(this.debtsCol, id));
  }

  async bulkPut(expenses: Expense[], debts: Debt[]) {
    // Firestore batches cap at 500 writes
    const items = [
      ...expenses.map((e) => ({ col: this.expensesCol, data: clean(e), id: e.id })),
      ...debts.map((d) => ({ col: this.debtsCol, data: clean(d), id: d.id })),
    ];
    for (let i = 0; i < items.length; i += 450) {
      const batch = writeBatch(this.db);
      for (const item of items.slice(i, i + 450)) {
        batch.set(doc(item.col, item.id), item.data);
      }
      await batch.commit();
    }
  }

  async clearAll() {
    for (const col of [this.expensesCol, this.debtsCol]) {
      const snap = await getDocs(col);
      for (let i = 0; i < snap.docs.length; i += 450) {
        const batch = writeBatch(this.db);
        for (const d of snap.docs.slice(i, i + 450)) batch.delete(d.ref);
        await batch.commit();
      }
    }
  }
}
