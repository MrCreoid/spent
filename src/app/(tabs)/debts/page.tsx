"use client";

import { useMemo, useState } from "react";
import { Segmented } from "@/components/ui/segmented";
import { EmptyState } from "@/components/ui/empty-state";
import { ListSkeleton } from "@/components/ui/skeleton";
import { Pressable } from "@/components/ui/pressable";
import { AnimatedMoney } from "@/components/ui/animated-number";
import { DebtsIcon, PlusIcon, SearchIcon, XIcon } from "@/components/icons";
import { DebtList } from "@/features/debts/debt-list";
import { useData } from "@/lib/data-context";
import { useSettings } from "@/lib/settings";
import { useUI } from "@/lib/ui-store";

type DirectionFilter = "all" | "lent" | "borrowed";
type StatusFilter = "pending" | "settled";

export default function DebtsPage() {
  const { debts, ready } = useData();
  const currency = useSettings((s) => s.currency);
  const openSheet = useUI((s) => s.openSheet);

  const [direction, setDirection] = useState<DirectionFilter>("all");
  const [status, setStatus] = useState<StatusFilter>("pending");
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);

  const { owedToMe, iOwe } = useMemo(() => {
    let owedToMe = 0;
    let iOwe = 0;
    for (const d of debts) {
      if (d.status !== "pending") continue;
      if (d.type === "lent") owedToMe += d.amount;
      else iOwe += d.amount;
    }
    return { owedToMe, iOwe };
  }, [debts]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return debts.filter((d) => {
      if (d.status !== status) return false;
      if (direction !== "all" && d.type !== direction) return false;
      if (q && !d.person.toLowerCase().includes(q) && !(d.reason ?? "").toLowerCase().includes(q))
        return false;
      return true;
    });
  }, [debts, direction, status, query]);

  return (
    <div className="pt-6">
      <header className="px-1">
        <div className="flex items-start justify-between">
          <h1 className="text-[28px] font-bold tracking-tight text-ink">Debts</h1>
          <Pressable
            aria-label={searchOpen ? "Close search" : "Search debts"}
            onClick={() => {
              setSearchOpen((v) => !v);
              setQuery("");
            }}
            className="mt-1 flex h-9 w-9 items-center justify-center rounded-full bg-card-2 text-ink-2"
          >
            {searchOpen ? <XIcon size={17} /> : <SearchIcon size={17} />}
          </Pressable>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-card bg-card px-4 py-3.5">
            <p className="text-[12px] font-semibold uppercase tracking-wide text-ink-3">
              Owed to you
            </p>
            <AnimatedMoney
              value={owedToMe}
              currency={currency}
              className="mt-1 block text-[22px] font-bold tracking-tight text-positive"
            />
          </div>
          <div className="rounded-card bg-card px-4 py-3.5">
            <p className="text-[12px] font-semibold uppercase tracking-wide text-ink-3">
              You owe
            </p>
            <AnimatedMoney
              value={iOwe}
              currency={currency}
              className="mt-1 block text-[22px] font-bold tracking-tight text-negative"
            />
          </div>
        </div>
      </header>

      {searchOpen && (
        <input
          type="search"
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by person or reason"
          className="mt-4 w-full rounded-xl bg-card-2 px-4 py-3 text-[15px] text-ink placeholder:text-ink-3"
          aria-label="Search debts"
        />
      )}

      <div className="mt-4 flex items-center gap-2">
        <Segmented
          ariaLabel="Direction"
          className="flex-1"
          options={[
            { value: "all", label: "All" },
            { value: "lent", label: "They owe" },
            { value: "borrowed", label: "I owe" },
          ]}
          value={direction}
          onChange={setDirection}
        />
        <Segmented
          ariaLabel="Status"
          options={[
            { value: "pending", label: "Open" },
            { value: "settled", label: "Settled" },
          ]}
          value={status}
          onChange={setStatus}
        />
      </div>

      <div className="mt-4">
        {!ready ? (
          <ListSkeleton rows={3} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<DebtsIcon size={28} />}
            title={
              query
                ? "No matches"
                : status === "settled"
                  ? "Nothing settled yet"
                  : "All square"
            }
            message={
              query
                ? "Try a different name or reason."
                : status === "settled"
                  ? "Settled debts will show up here."
                  : "Money you lend or borrow will show up here."
            }
            action={
              !query && status === "pending" ? (
                <Pressable
                  onClick={() => openSheet({ kind: "debt" })}
                  className="flex items-center gap-2 rounded-full bg-accent px-5 py-3 text-[15px] font-semibold text-white"
                >
                  <PlusIcon size={18} strokeWidth={2.2} />
                  Add debt
                </Pressable>
              ) : undefined
            }
          />
        ) : (
          <DebtList debts={filtered} />
        )}
      </div>
    </div>
  );
}
