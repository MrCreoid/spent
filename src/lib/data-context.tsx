"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Debt, Expense } from "./types";
import type { DataRepo } from "./repo/types";
import { LocalRepo } from "./repo/local";
import { CloudRepo } from "./repo/cloud";
import { getDb } from "./firebase";
import { useAuth } from "./auth-context";
import { newId } from "./id";

interface DataContextValue {
  expenses: Expense[];
  debts: Debt[];
  /** False until the first snapshot has arrived (drives skeletons) */
  ready: boolean;
  /** True when data is syncing to the cloud (signed in) */
  synced: boolean;

  addExpense: (data: Omit<Expense, "id" | "createdAt" | "updatedAt">) => Promise<void>;
  updateExpense: (expense: Expense) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;

  addDebt: (data: Omit<Debt, "id" | "createdAt" | "updatedAt">) => Promise<void>;
  updateDebt: (debt: Debt) => Promise<void>;
  deleteDebt: (id: string) => Promise<void>;

  exportData: () => { expenses: Expense[]; debts: Debt[]; exportedAt: string; app: string };
  importData: (json: unknown) => Promise<{ expenses: number; debts: number }>;
  resetAll: () => Promise<void>;
}

const DataContext = createContext<DataContextValue | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [ready, setReady] = useState(false);
  const migratedFor = useRef<string | null>(null);

  const repo: DataRepo | null = useMemo(() => {
    if (loading) return null;
    if (user) {
      const db = getDb();
      if (db) return new CloudRepo(db, user.uid);
    }
    return new LocalRepo();
  }, [user, loading]);

  // One-time migration of guest data into the user's cloud store
  useEffect(() => {
    if (!user || !repo || !(repo instanceof CloudRepo)) return;
    const flag = `spent-migrated-${user.uid}`;
    if (localStorage.getItem(flag) || migratedFor.current === user.uid) return;
    migratedFor.current = user.uid;
    void new LocalRepo().snapshot().then(async ({ expenses, debts }) => {
      if (expenses.length || debts.length) {
        await repo.bulkPut(expenses, debts);
      }
      localStorage.setItem(flag, "1");
    });
  }, [user, repo]);

  useEffect(() => {
    if (!repo) return;
    setReady(false);
    let gotExpenses = false;
    let gotDebts = false;
    const markReady = () => {
      if (gotExpenses && gotDebts) setReady(true);
    };
    const unsubE = repo.subscribeExpenses((rows) => {
      setExpenses(rows);
      gotExpenses = true;
      markReady();
    });
    const unsubD = repo.subscribeDebts((rows) => {
      setDebts(rows);
      gotDebts = true;
      markReady();
    });
    return () => {
      unsubE();
      unsubD();
    };
  }, [repo]);

  const value = useMemo<DataContextValue>(() => {
    const sortedExpenses = [...expenses].sort((a, b) =>
      a.date === b.date ? b.time.localeCompare(a.time) || b.createdAt - a.createdAt : b.date.localeCompare(a.date)
    );
    const sortedDebts = [...debts].sort((a, b) => b.createdAt - a.createdAt);

    const requireRepo = (): DataRepo => {
      if (!repo) throw new Error("Storage not ready yet");
      return repo;
    };

    return {
      expenses: sortedExpenses,
      debts: sortedDebts,
      ready,
      synced: Boolean(user),

      addExpense: async (data) => {
        const now = Date.now();
        await requireRepo().putExpense({ ...data, id: newId(), createdAt: now, updatedAt: now });
      },
      updateExpense: async (expense) => {
        await requireRepo().putExpense({ ...expense, updatedAt: Date.now() });
      },
      deleteExpense: (id) => requireRepo().deleteExpense(id),

      addDebt: async (data) => {
        const now = Date.now();
        await requireRepo().putDebt({ ...data, id: newId(), createdAt: now, updatedAt: now });
      },
      updateDebt: async (debt) => {
        await requireRepo().putDebt({ ...debt, updatedAt: Date.now() });
      },
      deleteDebt: (id) => requireRepo().deleteDebt(id),

      exportData: () => ({
        app: "spent",
        exportedAt: new Date().toISOString(),
        expenses: sortedExpenses,
        debts: sortedDebts,
      }),

      importData: async (json) => {
        const parsed = json as { expenses?: Expense[]; debts?: Debt[] };
        const importedExpenses = Array.isArray(parsed?.expenses) ? parsed.expenses : [];
        const importedDebts = Array.isArray(parsed?.debts) ? parsed.debts : [];
        const validExpenses = importedExpenses.filter(
          (e) => e && typeof e.id === "string" && typeof e.amount === "number" && typeof e.date === "string"
        );
        const validDebts = importedDebts.filter(
          (d) => d && typeof d.id === "string" && typeof d.amount === "number" && typeof d.person === "string"
        );
        if (!validExpenses.length && !validDebts.length) {
          throw new Error("This file doesn't contain any Spent data.");
        }
        await requireRepo().bulkPut(validExpenses, validDebts);
        return { expenses: validExpenses.length, debts: validDebts.length };
      },

      resetAll: () => requireRepo().clearAll(),
    };
  }, [expenses, debts, ready, repo, user]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData(): DataContextValue {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used inside DataProvider");
  return ctx;
}
