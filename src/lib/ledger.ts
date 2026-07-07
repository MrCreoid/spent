import type { EntryKind, LedgerEntry, LedgerRecord, LegacyDebt } from "./types";
import { ENTRY_KINDS } from "./types";
import { formatShortDate } from "./dates";

/** Normalized grouping key for a person's name */
export function personKeyOf(name: string): string {
  return name.trim().replace(/\s+/g, " ").toLowerCase();
}

/** Signed effect of an entry on the balance (positive = they owe me) */
export function signedAmount(entry: LedgerEntry): number {
  return entry.kind === "lent" || entry.kind === "paid"
    ? entry.amount
    : -entry.amount;
}

export const isSettlement = (kind: EntryKind) =>
  kind === "received" || kind === "paid";

/* ------------------------------------------------------------------ */
/* Migration: legacy v1 debts → ledger entries                         */
/* ------------------------------------------------------------------ */

function isLegacy(row: LedgerRecord): row is LegacyDebt {
  return !("kind" in row);
}

/**
 * Converts any mix of legacy and current rows into ledger entries.
 * A legacy "settled" debt becomes the original entry plus a matching
 * settlement entry, so history is preserved and the balance nets to zero.
 */
export function upgradeRecords(rows: LedgerRecord[]): {
  entries: LedgerEntry[];
  needsRewrite: boolean;
} {
  const entries: LedgerEntry[] = [];
  let needsRewrite = false;

  for (const row of rows) {
    if (!isLegacy(row)) {
      entries.push(
        row.personKey ? row : { ...row, personKey: personKeyOf(row.person) }
      );
      continue;
    }
    needsRewrite = true;
    const base: LedgerEntry = {
      id: row.id,
      person: row.person.trim(),
      personKey: personKeyOf(row.person),
      amount: row.amount,
      kind: row.type,
      reason: row.reason,
      date: row.date,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
    entries.push(base);
    if (row.status === "settled") {
      entries.push({
        ...base,
        id: `${row.id}-s`,
        kind: row.type === "lent" ? "received" : "paid",
        reason: "Settled",
        createdAt: row.updatedAt,
        updatedAt: row.updatedAt,
      });
    }
  }
  return { entries, needsRewrite };
}

/** Loose validation for imported rows (either schema version) */
export function isImportableLedgerRow(row: unknown): row is LedgerRecord {
  if (!row || typeof row !== "object") return false;
  const r = row as Record<string, unknown>;
  const baseOk =
    typeof r.id === "string" &&
    typeof r.person === "string" &&
    typeof r.amount === "number" &&
    typeof r.date === "string";
  if (!baseOk) return false;
  return (
    ENTRY_KINDS.includes(r.kind as EntryKind) ||
    r.type === "lent" ||
    r.type === "borrowed"
  );
}

/* ------------------------------------------------------------------ */
/* People (aggregated ledgers)                                         */
/* ------------------------------------------------------------------ */

export interface PersonSummary {
  key: string;
  name: string;
  /** Positive: they owe me. Negative: I owe them. Zero: settled. */
  balance: number;
  entryCount: number;
  /** Latest entry date (yyyy-MM-dd) — used for "recently active" */
  lastDate: string;
  lastCreatedAt: number;
  /** Chronological, oldest first */
  entries: LedgerEntry[];
}

function chronological(a: LedgerEntry, b: LedgerEntry): number {
  return a.date === b.date
    ? a.createdAt - b.createdAt
    : a.date.localeCompare(b.date);
}

export function buildPeople(entries: LedgerEntry[]): PersonSummary[] {
  const map = new Map<string, PersonSummary>();
  for (const entry of entries) {
    let person = map.get(entry.personKey);
    if (!person) {
      person = {
        key: entry.personKey,
        name: entry.person,
        balance: 0,
        entryCount: 0,
        lastDate: entry.date,
        lastCreatedAt: entry.createdAt,
        entries: [],
      };
      map.set(entry.personKey, person);
    }
    person.entries.push(entry);
    person.balance += signedAmount(entry);
    person.entryCount += 1;
    if (entry.createdAt >= person.lastCreatedAt) {
      person.lastCreatedAt = entry.createdAt;
      person.name = entry.person; // most recent spelling wins
    }
    if (entry.date > person.lastDate) person.lastDate = entry.date;
  }
  const people = [...map.values()];
  for (const p of people) {
    p.entries.sort(chronological);
    // Guard against floating point residue from decimal amounts
    p.balance = Math.round(p.balance * 100) / 100;
  }
  return people;
}

/* ------------------------------------------------------------------ */
/* Timeline with running balance                                       */
/* ------------------------------------------------------------------ */

export interface TimelineRow {
  entry: LedgerEntry;
  /** Balance after this entry, computed chronologically */
  running: number;
}

/** Newest first, each row carrying the balance as of that entry */
export function buildTimeline(person: PersonSummary): TimelineRow[] {
  let running = 0;
  const rows = person.entries.map((entry) => {
    running = Math.round((running + signedAmount(entry)) * 100) / 100;
    return { entry, running };
  });
  return rows.reverse();
}

/* ------------------------------------------------------------------ */
/* Dashboard, filters, search                                          */
/* ------------------------------------------------------------------ */

export interface LedgerDashboard {
  owedToMe: { total: number; people: number };
  iOwe: { total: number; people: number };
  net: number;
}

export function ledgerDashboard(people: PersonSummary[]): LedgerDashboard {
  const dash: LedgerDashboard = {
    owedToMe: { total: 0, people: 0 },
    iOwe: { total: 0, people: 0 },
    net: 0,
  };
  for (const p of people) {
    if (p.balance > 0) {
      dash.owedToMe.total += p.balance;
      dash.owedToMe.people += 1;
    } else if (p.balance < 0) {
      dash.iOwe.total += -p.balance;
      dash.iOwe.people += 1;
    }
  }
  dash.net = Math.round((dash.owedToMe.total - dash.iOwe.total) * 100) / 100;
  return dash;
}

export type PeopleFilter = "all" | "owesMe" | "iOwe" | "settled";
export type PeopleSort = "recent" | "amount";

export function filterPeople(
  people: PersonSummary[],
  filter: PeopleFilter
): PersonSummary[] {
  switch (filter) {
    case "owesMe":
      return people.filter((p) => p.balance > 0);
    case "iOwe":
      return people.filter((p) => p.balance < 0);
    case "settled":
      return people.filter((p) => p.balance === 0);
    default:
      return people;
  }
}

export function sortPeople(
  people: PersonSummary[],
  sort: PeopleSort
): PersonSummary[] {
  const sorted = [...people];
  if (sort === "amount") {
    sorted.sort(
      (a, b) => Math.abs(b.balance) - Math.abs(a.balance) || b.lastCreatedAt - a.lastCreatedAt
    );
  } else {
    sorted.sort((a, b) => b.lastCreatedAt - a.lastCreatedAt);
  }
  return sorted;
}

/** Matches person name, any reason/note, amount, or date */
export function personMatches(person: PersonSummary, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  if (person.name.toLowerCase().includes(q)) return true;
  const asNumber = Number(q.replace(/[^\d.]/g, ""));
  const numeric = q !== "" && Number.isFinite(asNumber) && asNumber > 0;
  return person.entries.some((e) => {
    if (e.reason?.toLowerCase().includes(q)) return true;
    if (e.note?.toLowerCase().includes(q)) return true;
    if (e.date.includes(q)) return true;
    if (formatShortDate(e.date).toLowerCase().includes(q)) return true;
    if (numeric && (e.amount === asNumber || Math.abs(person.balance) === asNumber))
      return true;
    return false;
  });
}
