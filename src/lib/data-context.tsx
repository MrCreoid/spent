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
import type {
  CustomCategory,
  Expense,
  LedgerEntry,
  LedgerRecord,
  PersonRecord,
  RecurringExpense,
} from "./types";
import type { DataRepo } from "./repo/types";
import { LocalRepo } from "./repo/local";
import { CloudRepo } from "./repo/cloud";
import { getDb } from "./firebase";
import { useAuth } from "./auth-context";
import { newId } from "./id";
import { daysInMonth, todayISO, toISODate } from "./dates";
import { categorySlug } from "./categories";
import {
  buildPeople,
  isImportableLedgerRow,
  personKeyOf,
  upgradeRecords,
  type PersonSummary,
} from "./ledger";

interface DataContextValue {
  expenses: Expense[];
  /** All ledger entries, normalized to the current schema */
  entries: LedgerEntry[];
  /** Aggregated per-person ledgers (declared people + entry-derived) */
  people: PersonSummary[];
  /** User-created expense categories */
  customCategories: CustomCategory[];
  /** Monthly autopay expenses */
  recurring: RecurringExpense[];
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

  /** Create (or recolor) a person without any transaction */
  addPerson: (name: string, color?: number) => Promise<void>;
  /** Remove a person's entire ledger and their record */
  deletePerson: (personKey: string) => Promise<void>;

  /** Create a custom expense category; returns its id */
  addCategory: (label: string, color: number) => Promise<string>;

  addRecurring: (
    data: Omit<RecurringExpense, "id" | "createdAt" | "updatedAt" | "lastAppliedMonth">
  ) => Promise<void>;
  deleteRecurring: (id: string) => Promise<void>;

  exportData: () => {
    app: string;
    version: number;
    exportedAt: string;
    expenses: Expense[];
    debts: LedgerEntry[];
    people: PersonRecord[];
    categories: CustomCategory[];
    recurring: RecurringExpense[];
  };
  importData: (json: unknown) => Promise<{ expenses: number; entries: number }>;
  resetAll: () => Promise<void>;
}

const DataContext = createContext<DataContextValue | null>(null);

function isImportablePerson(row: unknown): row is PersonRecord {
  if (!row || typeof row !== "object") return false;
  const r = row as Record<string, unknown>;
  return typeof r.id === "string" && typeof r.name === "string";
}

function isImportableCategory(row: unknown): row is CustomCategory {
  if (!row || typeof row !== "object") return false;
  const r = row as Record<string, unknown>;
  return (
    typeof r.id === "string" &&
    typeof r.label === "string" &&
    typeof r.color === "number"
  );
}

function isImportableRecurring(row: unknown): row is RecurringExpense {
  if (!row || typeof row !== "object") return false;
  const r = row as Record<string, unknown>;
  return (
    typeof r.id === "string" &&
    typeof r.amount === "number" &&
    typeof r.category === "string" &&
    typeof r.dayOfMonth === "number"
  );
}

const pad2 = (n: number) => String(n).padStart(2, "0");

/**
 * Occurrences of a recurring expense that are due but not yet applied,
 * from the month after `lastAppliedMonth` (or the creation month) up to
 * today. Never before the creation date, never in the future.
 */
function dueOccurrences(
  r: RecurringExpense,
  today: string
): { month: string; date: string }[] {
  const created = new Date(r.createdAt);
  const createdDate = toISODate(created);
  let y: number;
  let m: number; // 1-based
  if (r.lastAppliedMonth) {
    const [ly, lm] = r.lastAppliedMonth.split("-").map(Number);
    y = lm === 12 ? ly + 1 : ly;
    m = lm === 12 ? 1 : lm + 1;
  } else {
    y = created.getFullYear();
    m = created.getMonth() + 1;
  }
  const [ty, tm] = today.split("-").map(Number);
  const out: { month: string; date: string }[] = [];
  let guard = 0;
  while ((y < ty || (y === ty && m <= tm)) && guard++ < 36) {
    const day = Math.min(r.dayOfMonth, daysInMonth(y, m - 1));
    const date = `${y}-${pad2(m)}-${pad2(day)}`;
    if (date <= today && date >= createdDate) {
      out.push({ month: `${y}-${pad2(m)}`, date });
    }
    m += 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
  }
  return out;
}

export function DataProvider({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [personRecords, setPersonRecords] = useState<PersonRecord[]>([]);
  const [customCategories, setCustomCategories] = useState<CustomCategory[]>([]);
  const [recurring, setRecurring] = useState<RecurringExpense[]>([]);
  const [ready, setReady] = useState(false);
  const migratedFor = useRef<string | null>(null);
  const rewroteLedger = useRef(false);
  const applyingAutopay = useRef(false);

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
    void new LocalRepo()
      .snapshot()
      .then(async ({ expenses, ledger, people, categories, recurring }) => {
        const { entries } = upgradeRecords(ledger);
        if (
          expenses.length ||
          entries.length ||
          people.length ||
          categories.length ||
          recurring.length
        ) {
          await repo.bulkPut({ expenses, entries, people, categories, recurring });
        }
        localStorage.setItem(flag, "1");
      });
  }, [user, repo]);

  useEffect(() => {
    if (!repo) return;
    setReady(false);
    rewroteLedger.current = false;
    const got = {
      expenses: false,
      ledger: false,
      people: false,
      categories: false,
      recurring: false,
    };
    const markReady = () => {
      if (Object.values(got).every(Boolean)) setReady(true);
    };
    const subs = [
      repo.subscribeExpenses((rows) => {
        setExpenses(rows);
        got.expenses = true;
        markReady();
      }),
      repo.subscribeLedger((rows: LedgerRecord[]) => {
        const { entries: upgraded, needsRewrite } = upgradeRecords(rows);
        setEntries(upgraded);
        got.ledger = true;
        markReady();
        // Persist the v1 → v2 schema upgrade exactly once per store
        if (needsRewrite && !rewroteLedger.current) {
          rewroteLedger.current = true;
          void repo.bulkPut({ entries: upgraded });
        }
      }),
      repo.subscribePeople((rows) => {
        setPersonRecords(rows);
        got.people = true;
        markReady();
      }),
      repo.subscribeCategories((rows) => {
        setCustomCategories(rows);
        got.categories = true;
        markReady();
      }),
      repo.subscribeRecurring((rows) => {
        setRecurring(rows);
        got.recurring = true;
        markReady();
      }),
    ];
    return () => subs.forEach((unsub) => unsub());
  }, [repo]);

  // Autopay: apply due recurring expenses. Generated ids are
  // deterministic (rec-{id}-{yyyy-MM}), so re-runs and multiple
  // devices converge on the same documents instead of duplicating.
  useEffect(() => {
    if (!ready || !repo || recurring.length === 0 || applyingAutopay.current) return;
    const today = todayISO();
    const work = recurring
      .map((r) => ({ r, due: dueOccurrences(r, today) }))
      .filter(({ due }) => due.length > 0);
    if (work.length === 0) return;
    applyingAutopay.current = true;
    void (async () => {
      try {
        for (const { r, due } of work) {
          for (const occ of due) {
            await repo.putExpense({
              id: `rec-${r.id}-${occ.month}`,
              amount: r.amount,
              category: r.category,
              date: occ.date,
              time: "09:00",
              note: r.note || "Autopay",
              createdAt: r.createdAt,
              updatedAt: Date.now(),
            });
          }
          await repo.putRecurring({
            ...r,
            lastAppliedMonth: due[due.length - 1].month,
            updatedAt: Date.now(),
          });
        }
      } finally {
        applyingAutopay.current = false;
      }
    })();
  }, [ready, repo, recurring]);

  const value = useMemo<DataContextValue>(() => {
    const sortedExpenses = [...expenses].sort((a, b) =>
      a.date === b.date
        ? b.time.localeCompare(a.time) || b.createdAt - a.createdAt
        : b.date.localeCompare(a.date)
    );
    const sortedEntries = [...entries].sort((a, b) => b.createdAt - a.createdAt);
    const people = buildPeople(entries, personRecords);
    const sortedCategories = [...customCategories].sort(
      (a, b) => a.createdAt - b.createdAt
    );
    const sortedRecurring = [...recurring].sort((a, b) => a.createdAt - b.createdAt);

    const requireRepo = (): DataRepo => {
      if (!repo) throw new Error("Storage not ready yet");
      return repo;
    };

    return {
      expenses: sortedExpenses,
      entries: sortedEntries,
      people,
      customCategories: sortedCategories,
      recurring: sortedRecurring,
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

      addPerson: async (name, color) => {
        const trimmed = name.trim();
        const id = personKeyOf(trimmed);
        const existing = personRecords.find((p) => p.id === id);
        const now = Date.now();
        await requireRepo().putPerson({
          id,
          name: trimmed,
          color,
          createdAt: existing?.createdAt ?? now,
          updatedAt: now,
        });
      },

      deletePerson: async (personKey) => {
        const ids = entries
          .filter((e) => e.personKey === personKey)
          .map((e) => e.id);
        if (ids.length) await requireRepo().deleteEntries(ids);
        await requireRepo().deletePersonRecord(personKey);
      },

      addCategory: async (label, color) => {
        const trimmed = label.trim();
        const id = categorySlug(trimmed) || newId();
        const existing = customCategories.find((c) => c.id === id);
        const now = Date.now();
        await requireRepo().putCategory({
          id,
          label: trimmed,
          color,
          createdAt: existing?.createdAt ?? now,
          updatedAt: now,
        });
        return id;
      },

      addRecurring: async (data) => {
        const now = Date.now();
        await requireRepo().putRecurring({
          ...data,
          note: data.note?.trim() || undefined,
          id: newId(),
          createdAt: now,
          updatedAt: now,
        });
      },
      deleteRecurring: (id) => requireRepo().deleteRecurring(id),

      exportData: () => ({
        app: "spent",
        version: 4,
        exportedAt: new Date().toISOString(),
        expenses: sortedExpenses,
        debts: sortedEntries,
        people: personRecords,
        categories: sortedCategories,
        recurring: sortedRecurring,
      }),

      importData: async (json) => {
        const parsed = json as {
          expenses?: unknown[];
          debts?: unknown[];
          entries?: unknown[];
          people?: unknown[];
          categories?: unknown[];
          recurring?: unknown[];
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
        const validPeople = (
          Array.isArray(parsed?.people) ? parsed.people : []
        ).filter(isImportablePerson);
        const validCategories = (
          Array.isArray(parsed?.categories) ? parsed.categories : []
        ).filter(isImportableCategory);
        const validRecurring = (
          Array.isArray(parsed?.recurring) ? parsed.recurring : []
        ).filter(isImportableRecurring);
        if (
          !validExpenses.length &&
          !validEntries.length &&
          !validPeople.length &&
          !validCategories.length &&
          !validRecurring.length
        ) {
          throw new Error("This file doesn't contain any Spent data.");
        }
        await requireRepo().bulkPut({
          expenses: validExpenses,
          entries: validEntries,
          people: validPeople,
          categories: validCategories,
          recurring: validRecurring,
        });
        return { expenses: validExpenses.length, entries: validEntries.length };
      },

      resetAll: () => requireRepo().clearAll(),
    };
  }, [expenses, entries, personRecords, customCategories, recurring, ready, repo, user]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData(): DataContextValue {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used inside DataProvider");
  return ctx;
}
