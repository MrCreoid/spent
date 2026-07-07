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
import type { Expense, LedgerEntry, LedgerRecord } from "./types";
import type { DataRepo } from "./repo/types";
import { LocalRepo } from "./repo/local";
import { CloudRepo } from "./repo/cloud";
import { getDb } from "./firebase";
import { useAuth } from "./auth-context";
import { newId } from "./id";
import {
  isImportableLedgerRow,
  personKeyOf,
  upgradeRecords,
} from "./ledger";

interface DataContextValue {
  expenses: Expense[];
  /** All ledger entries, normalized to the current schema */
  entries: LedgerEntry[];
  /** False until the first snapshot has arrived (drives skeletons) */
  ready: boolean;
  /** True when data is syncing to the cloud (signed in) */
  synced: boolean;

  addExpense: (data: Omit<Expense, "id" | "createdAt" | "updatedAt">) => Promise<void>;
  updateExpense: (expense: Expense) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;

  addEntry: (
    data: Omit<LedgerEntry, "id" | "personKey" | "createdAt" | "updatedAt">
  ) => Promise<void>;
  updateEntry: (entry: LedgerEntry) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
  /** Remove a person's entire ledger */
  deletePerson: (personKey: string) => Promise<void>;

  exportData: () => {
    app: string;
    version: number;
    exportedAt: string;
    expenses: Expense[];
    debts: LedgerEntry[];
  };
  importData: (json: unknown) => Promise<{ expenses: number; entries: number }>;
  resetAll: () => Promise<void>;
}

const DataContext = createContext<DataContextValue | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [ready, setReady] = useState(false);
  const migratedFor = useRef<string | null>(null);
  const rewroteLedger = useRef(false);

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
    void new LocalRepo().snapshot().then(async ({ expenses, ledger }) => {
      const { entries } = upgradeRecords(ledger);
      if (expenses.length || entries.length) {
        await repo.bulkPut(expenses, entries);
      }
      localStorage.setItem(flag, "1");
    });
  }, [user, repo]);

  useEffect(() => {
    if (!repo) return;
    setReady(false);
    rewroteLedger.current = false;
    let gotExpenses = false;
    let gotLedger = false;
    const markReady = () => {
      if (gotExpenses && gotLedger) setReady(true);
    };
    const unsubE = repo.subscribeExpenses((rows) => {
      setExpenses(rows);
      gotExpenses = true;
      markReady();
    });
    const unsubL = repo.subscribeLedger((rows: LedgerRecord[]) => {
      const { entries: upgraded, needsRewrite } = upgradeRecords(rows);
      setEntries(upgraded);
      gotLedger = true;
      markReady();
      // Persist the v1 → v2 schema upgrade exactly once per store
      if (needsRewrite && !rewroteLedger.current) {
        rewroteLedger.current = true;
        void repo.bulkPut([], upgraded);
      }
    });
    return () => {
      unsubE();
      unsubL();
    };
  }, [repo]);

  const value = useMemo<DataContextValue>(() => {
    const sortedExpenses = [...expenses].sort((a, b) =>
      a.date === b.date
        ? b.time.localeCompare(a.time) || b.createdAt - a.createdAt
        : b.date.localeCompare(a.date)
    );
    const sortedEntries = [...entries].sort((a, b) => b.createdAt - a.createdAt);

    const requireRepo = (): DataRepo => {
      if (!repo) throw new Error("Storage not ready yet");
      return repo;
    };

    return {
      expenses: sortedExpenses,
      entries: sortedEntries,
      ready,
      synced: Boolean(user),

      addExpense: async (data) => {
        const now = Date.now();
        await requireRepo().putExpense({
          ...data,
          id: newId(),
          createdAt: now,
          updatedAt: now,
        });
      },
      updateExpense: async (expense) => {
        await requireRepo().putExpense({ ...expense, updatedAt: Date.now() });
      },
      deleteExpense: (id) => requireRepo().deleteExpense(id),

      addEntry: async (data) => {
        const now = Date.now();
        await requireRepo().putEntry({
          ...data,
          person: data.person.trim(),
          personKey: personKeyOf(data.person),
          id: newId(),
          createdAt: now,
          updatedAt: now,
        });
      },
      updateEntry: async (entry) => {
        await requireRepo().putEntry({
          ...entry,
          person: entry.person.trim(),
          personKey: personKeyOf(entry.person),
          updatedAt: Date.now(),
        });
      },
      deleteEntry: (id) => requireRepo().deleteEntry(id),
      deletePerson: async (personKey) => {
        const ids = entries
          .filter((e) => e.personKey === personKey)
          .map((e) => e.id);
        if (ids.length) await requireRepo().deleteEntries(ids);
      },

      exportData: () => ({
        app: "spent",
        version: 2,
        exportedAt: new Date().toISOString(),
        expenses: sortedExpenses,
        debts: sortedEntries,
      }),

      importData: async (json) => {
        const parsed = json as {
          expenses?: unknown[];
          debts?: unknown[];
          entries?: unknown[];
        };
        const validExpenses = (
          Array.isArray(parsed?.expenses) ? parsed.expenses : []
        ).filter(
          (e): e is Expense =>
            !!e &&
            typeof (e as Expense).id === "string" &&
            typeof (e as Expense).amount === "number" &&
            typeof (e as Expense).date === "string"
        );
        const rawLedger = [
          ...(Array.isArray(parsed?.debts) ? parsed.debts : []),
          ...(Array.isArray(parsed?.entries) ? parsed.entries : []),
        ].filter(isImportableLedgerRow);
        const { entries: validEntries } = upgradeRecords(rawLedger);
        if (!validExpenses.length && !validEntries.length) {
          throw new Error("This file doesn't contain any Spent data.");
        }
        await requireRepo().bulkPut(validExpenses, validEntries);
        return { expenses: validExpenses.length, entries: validEntries.length };
      },

      resetAll: () => requireRepo().clearAll(),
    };
  }, [expenses, entries, ready, repo, user]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData(): DataContextValue {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used inside DataProvider");
  return ctx;
}
