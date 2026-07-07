"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Segmented } from "@/components/ui/segmented";
import { EmptyState } from "@/components/ui/empty-state";
import { ListSkeleton } from "@/components/ui/skeleton";
import { Pressable } from "@/components/ui/pressable";
import { AnimatedMoney } from "@/components/ui/animated-number";
import {
  ArrowDownLeftIcon,
  ArrowUpRightIcon,
  ChevronRightIcon,
  DebtsIcon,
  HandshakeIcon,
  PlusIcon,
  SearchIcon,
  XIcon,
} from "@/components/icons";
import { PersonAvatar } from "@/features/debts/avatar";
import { LedgerView } from "@/features/debts/ledger-view";
import { formatMoney } from "@/lib/currency";
import { formatShortDate } from "@/lib/dates";
import {
  buildPeople,
  filterPeople,
  isSettlement,
  ledgerDashboard,
  personMatches,
  sortPeople,
  type PeopleFilter,
  type PeopleSort,
} from "@/lib/ledger";
import { useData } from "@/lib/data-context";
import { useSettings } from "@/lib/settings";
import { useUI } from "@/lib/ui-store";

export default function DebtsPage() {
  const { entries, ready } = useData();
  const currency = useSettings((s) => s.currency);
  const openSheet = useUI((s) => s.openSheet);
  const reduceMotion = useReducedMotion();

  const [filter, setFilter] = useState<PeopleFilter>("all");
  const [sort, setSort] = useState<PeopleSort>("recent");
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const people = useMemo(() => buildPeople(entries), [entries]);
  const dashboard = useMemo(() => ledgerDashboard(people), [people]);
  const selected = selectedKey
    ? (people.find((p) => p.key === selectedKey) ?? null)
    : null;

  const visible = useMemo(() => {
    const q = query.trim();
    let list = filterPeople(people, filter);
    if (q) list = list.filter((p) => personMatches(p, q));
    return sortPeople(list, sort);
  }, [people, filter, sort, query]);

  const recent = useMemo(
    () => [...entries].sort((a, b) => b.createdAt - a.createdAt).slice(0, 4),
    [entries]
  );

  // "/" shortcut → open + focus search
  useEffect(() => {
    const focus = () => {
      setSearchOpen(true);
      requestAnimationFrame(() => searchRef.current?.focus());
    };
    window.addEventListener("spent-focus-search", focus);
    return () => window.removeEventListener("spent-focus-search", focus);
  }, []);

  // If the selected person disappears (deleted), return to the list
  useEffect(() => {
    if (selectedKey && !selected) setSelectedKey(null);
  }, [selectedKey, selected]);

  return (
    <div className="pt-6">
      <AnimatePresence mode="popLayout" initial={false}>
        {selected ? (
          <motion.div
            key={`person-${selected.key}`}
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, x: 56 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: 56 }}
            transition={{ type: "spring", stiffness: 380, damping: 36 }}
            className="mx-auto max-w-2xl"
          >
            <LedgerView person={selected} onBack={() => setSelectedKey(null)} />
          </motion.div>
        ) : (
          <motion.div
            key="people"
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, x: -56 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: -56 }}
            transition={{ type: "spring", stiffness: 380, damping: 36 }}
          >
            {/* Header */}
            <header className="px-1">
              <div className="flex items-start justify-between">
                <h1 className="text-[28px] font-bold tracking-tight text-ink">
                  Debts
                </h1>
                <Pressable
                  aria-label={searchOpen ? "Close search" : "Search people"}
                  onClick={() => {
                    setSearchOpen((v) => !v);
                    setQuery("");
                    if (!searchOpen)
                      requestAnimationFrame(() => searchRef.current?.focus());
                  }}
                  className="mt-1 flex h-9 w-9 items-center justify-center rounded-full bg-card-2 text-ink-2"
                >
                  {searchOpen ? <XIcon size={17} /> : <SearchIcon size={17} />}
                </Pressable>
              </div>

              {/* Dashboard */}
              <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-3">
                <div className="rounded-card bg-card px-4 py-3.5 transition-colors duration-200 hover:bg-card-2/60">
                  <p className="flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-wide text-ink-3">
                    <ArrowUpRightIcon size={13} className="text-positive" />
                    Owed to you
                  </p>
                  <AnimatedMoney
                    value={dashboard.owedToMe.total}
                    currency={currency}
                    className="mt-1 block text-[22px] font-bold tracking-tight text-positive"
                  />
                  <p className="mt-0.5 text-[12px] text-ink-3">
                    {dashboard.owedToMe.people}{" "}
                    {dashboard.owedToMe.people === 1 ? "person" : "people"}
                  </p>
                </div>
                <div className="rounded-card bg-card px-4 py-3.5 transition-colors duration-200 hover:bg-card-2/60">
                  <p className="flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-wide text-ink-3">
                    <ArrowDownLeftIcon size={13} className="text-negative" />
                    You owe
                  </p>
                  <AnimatedMoney
                    value={dashboard.iOwe.total}
                    currency={currency}
                    className="mt-1 block text-[22px] font-bold tracking-tight text-negative"
                  />
                  <p className="mt-0.5 text-[12px] text-ink-3">
                    {dashboard.iOwe.people}{" "}
                    {dashboard.iOwe.people === 1 ? "person" : "people"}
                  </p>
                </div>
                <div className="col-span-2 rounded-card bg-card px-4 py-3.5 transition-colors duration-200 hover:bg-card-2/60 lg:col-span-1">
                  <p className="text-[12px] font-semibold uppercase tracking-wide text-ink-3">
                    Net outstanding
                  </p>
                  <div className="mt-1 flex items-baseline gap-2 lg:block">
                    <AnimatedMoney
                      value={Math.abs(dashboard.net)}
                      currency={currency}
                      className={`block text-[22px] font-bold tracking-tight ${
                        dashboard.net === 0
                          ? "text-ink-3"
                          : dashboard.net > 0
                            ? "text-positive"
                            : "text-negative"
                      }`}
                    />
                    <p className="text-[12px] text-ink-3 lg:mt-0.5">
                      {dashboard.net === 0
                        ? "all square"
                        : dashboard.net > 0
                          ? "in your favour"
                          : "owed by you"}
                    </p>
                  </div>
                </div>
              </div>
            </header>

            {searchOpen && (
              <input
                ref={searchRef}
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search person, reason, amount or date"
                className="mt-4 w-full rounded-xl bg-card-2 px-4 py-3 text-[15px] text-ink placeholder:text-ink-3"
                aria-label="Search people"
              />
            )}

            {/* Filters */}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Segmented
                ariaLabel="Filter people"
                className="w-full sm:w-auto sm:flex-1"
                options={[
                  { value: "all", label: "All" },
                  { value: "owesMe", label: "Owe me" },
                  { value: "iOwe", label: "I owe" },
                  { value: "settled", label: "Settled" },
                ]}
                value={filter}
                onChange={setFilter}
              />
              <Segmented
                ariaLabel="Sort people"
                options={[
                  { value: "recent", label: "Recent" },
                  { value: "amount", label: "Highest" },
                ]}
                value={sort}
                onChange={setSort}
              />
            </div>

            {/* People */}
            <div className="mt-4">
              {!ready ? (
                <ListSkeleton rows={3} />
              ) : visible.length === 0 ? (
                <EmptyState
                  icon={<DebtsIcon size={26} />}
                  title={
                    query
                      ? "No matches"
                      : people.length === 0
                        ? "No ledgers yet"
                        : filter === "settled"
                          ? "Nothing settled yet"
                          : "All square here"
                  }
                  message={
                    query
                      ? "Try a different name, reason or amount."
                      : people.length === 0
                        ? "Add an entry and Spent keeps a running balance for every person automatically."
                        : "Ledgers matching this filter will show up here."
                  }
                  action={
                    !query && people.length === 0 ? (
                      <Pressable
                        onClick={() => openSheet({ kind: "entry" })}
                        className="flex items-center gap-2 rounded-full bg-accent px-5 py-3 text-[15px] font-semibold text-white"
                      >
                        <PlusIcon size={18} strokeWidth={2.2} />
                        Add first entry
                      </Pressable>
                    ) : undefined
                  }
                />
              ) : (
                <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <AnimatePresence initial={false}>
                    {visible.map((person) => {
                      const owesMe = person.balance > 0;
                      const settled = person.balance === 0;
                      return (
                        <motion.li
                          key={person.key}
                          layout
                          initial={{ opacity: 0, scale: 0.96 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.96 }}
                          transition={{ type: "spring", stiffness: 400, damping: 34 }}
                        >
                          <Pressable
                            onClick={() => setSelectedKey(person.key)}
                            pressScale={0.98}
                            className="group flex w-full items-center gap-3.5 rounded-card bg-card px-4 py-4 text-left transition-colors duration-200 hover:bg-card-2/60"
                          >
                            <PersonAvatar name={person.name} size={44} />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-[15px] font-semibold text-ink">
                                {person.name}
                              </p>
                              <p className="mt-0.5 text-[12.5px] text-ink-3">
                                {settled
                                  ? "Settled"
                                  : owesMe
                                    ? "Owes you"
                                    : "You owe"}
                                {" · "}
                                {person.entryCount}{" "}
                                {person.entryCount === 1 ? "entry" : "entries"}
                              </p>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`tnum text-[16px] font-bold tracking-tight ${
                                  settled
                                    ? "text-ink-3"
                                    : owesMe
                                      ? "text-positive"
                                      : "text-negative"
                                }`}
                              >
                                {formatMoney(Math.abs(person.balance), currency)}
                              </span>
                              <ChevronRightIcon
                                size={15}
                                className="text-ink-3 transition-transform duration-200 group-hover:translate-x-0.5"
                              />
                            </div>
                          </Pressable>
                        </motion.li>
                      );
                    })}
                  </AnimatePresence>
                </ul>
              )}
            </div>

            {/* Recent activity */}
            {ready && recent.length > 0 && (
              <section className="mt-7" aria-label="Recent activity">
                <h2 className="px-1 pb-2 text-[13px] font-semibold uppercase tracking-wide text-ink-2">
                  Recent activity
                </h2>
                <div className="overflow-hidden rounded-card bg-card">
                  {recent.map((entry, i) => {
                    const settlement = isSettlement(entry.kind);
                    const positive = entry.kind === "lent";
                    return (
                      <div key={entry.id}>
                        {i > 0 && <div className="ml-4 h-px bg-line" />}
                        <button
                          onClick={() => setSelectedKey(entry.personKey)}
                          className="flex w-full cursor-pointer items-center gap-3 px-4 py-2.5 text-left transition-colors duration-150 hover:bg-card-2/60"
                        >
                          <PersonAvatar name={entry.person} size={30} />
                          <p className="min-w-0 flex-1 truncate text-[13.5px] text-ink-2">
                            <span className="font-medium text-ink">
                              {entry.person}
                            </span>
                            {" · "}
                            {entry.reason ||
                              (settlement ? "Settlement" : "Entry")}
                            {" · "}
                            {formatShortDate(entry.date)}
                          </p>
                          <span
                            className={`tnum text-[13.5px] font-semibold ${
                              settlement
                                ? "text-ink-2"
                                : positive
                                  ? "text-positive"
                                  : "text-negative"
                            }`}
                          >
                            {settlement ? (
                              <HandshakeIcon size={14} className="mr-0.5 inline" />
                            ) : positive ? (
                              "+"
                            ) : (
                              "−"
                            )}
                            {formatMoney(entry.amount, currency)}
                          </span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
