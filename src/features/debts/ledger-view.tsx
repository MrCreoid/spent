"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Pressable } from "@/components/ui/pressable";
import { SwipeRow } from "@/components/ui/swipe-row";
import { ConfirmSheet } from "@/components/ui/confirm-sheet";
import { AnimatedMoney } from "@/components/ui/animated-number";
import {
  ArrowDownLeftIcon,
  ArrowUpRightIcon,
  ChevronLeftIcon,
  HandshakeIcon,
  PlusIcon,
  TrashIcon,
} from "@/components/icons";
import { PersonAvatar } from "./avatar";
import { formatMoney } from "@/lib/currency";
import { formatShortDate } from "@/lib/dates";
import { haptic } from "@/lib/haptics";
import { buildTimeline, isSettlement, type PersonSummary } from "@/lib/ledger";
import { useData } from "@/lib/data-context";
import { useSettings } from "@/lib/settings";
import { useUI } from "@/lib/ui-store";
import type { LedgerEntry } from "@/lib/types";

interface LedgerViewProps {
  person: PersonSummary;
  onBack: () => void;
}

export function LedgerView({ person, onBack }: LedgerViewProps) {
  const { deleteEntry, deletePerson } = useData();
  const currency = useSettings((s) => s.currency);
  const openSheet = useUI((s) => s.openSheet);
  const [pendingDelete, setPendingDelete] = useState<LedgerEntry | null>(null);
  const [confirmPerson, setConfirmPerson] = useState(false);

  const timeline = useMemo(() => buildTimeline(person), [person]);
  const owesMe = person.balance > 0;
  const settled = person.balance === 0;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between">
        <Pressable
          aria-label="Back to people"
          onClick={onBack}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-card-2 text-ink-2"
        >
          <ChevronLeftIcon size={18} />
        </Pressable>
        <Pressable
          aria-label={`Delete ${person.name} and all entries`}
          onClick={() => setConfirmPerson(true)}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-card-2 text-ink-3 transition-colors duration-150 hover:text-negative"
        >
          <TrashIcon size={16} />
        </Pressable>
      </div>

      {/* Balance hero */}
      <div className="mt-5 flex flex-col items-center text-center">
        <PersonAvatar name={person.name} size={64} />
        <h1 className="mt-3 text-[22px] font-bold tracking-tight text-ink">
          {person.name}
        </h1>
        <p className="mt-0.5 text-[13px] font-medium text-ink-2">
          {settled
            ? "All settled"
            : owesMe
              ? `${person.name} owes you`
              : `You owe ${person.name}`}
        </p>
        <AnimatedMoney
          value={Math.abs(person.balance)}
          currency={currency}
          className={`mt-1 block text-[38px] font-bold leading-tight tracking-tight ${
            settled ? "text-ink-3" : owesMe ? "text-positive" : "text-negative"
          }`}
        />
        <p className="mt-1 text-[12px] text-ink-3">
          {person.entryCount} {person.entryCount === 1 ? "entry" : "entries"}
        </p>

        <div className="mt-5 flex gap-2.5">
          <Pressable
            onClick={() => {
              haptic();
              openSheet({ kind: "entry", person: person.name });
            }}
            className="flex items-center gap-1.5 rounded-full bg-accent px-4 py-2.5 text-[14px] font-semibold text-white"
          >
            <PlusIcon size={16} strokeWidth={2.2} />
            Add entry
          </Pressable>
          {!settled && (
            <Pressable
              onClick={() => {
                haptic();
                openSheet({ kind: "settle", personKey: person.key });
              }}
              className="flex items-center gap-1.5 rounded-full bg-card-2 px-4 py-2.5 text-[14px] font-semibold text-ink"
            >
              <HandshakeIcon size={16} />
              Settle up
            </Pressable>
          )}
        </div>
      </div>

      {/* Timeline */}
      <section className="mt-7" aria-label={`Ledger with ${person.name}`}>
        <div className="flex items-baseline justify-between px-1 pb-2">
          <h2 className="text-[13px] font-semibold uppercase tracking-wide text-ink-2">
            Timeline
          </h2>
          <span className="text-[12px] text-ink-3">Balance after each entry</span>
        </div>
        <div className="overflow-hidden rounded-card bg-card">
          <AnimatePresence initial={false}>
            {timeline.map(({ entry, running }, i) => {
              const settlement = isSettlement(entry.kind);
              const positive = entry.kind === "lent";
              return (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ type: "spring", stiffness: 400, damping: 40 }}
                >
                  {i > 0 && <div className="ml-[64px] h-px bg-line" />}
                  <SwipeRow
                    onTap={() => openSheet({ kind: "entry", initial: entry })}
                    actions={[
                      {
                        label: "Edit",
                        icon: "edit",
                        onAction: () => openSheet({ kind: "entry", initial: entry }),
                      },
                      {
                        label: "Delete",
                        icon: "delete",
                        onAction: () => setPendingDelete(entry),
                      },
                    ]}
                  >
                    <div className="flex items-center gap-3.5 px-4 py-3">
                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                          settlement
                            ? "bg-accent-soft text-accent"
                            : positive
                              ? "bg-positive-soft text-positive"
                              : "bg-negative-soft text-negative"
                        }`}
                        aria-hidden="true"
                      >
                        {settlement ? (
                          <HandshakeIcon size={17} />
                        ) : positive ? (
                          <ArrowUpRightIcon size={17} />
                        ) : (
                          <ArrowDownLeftIcon size={17} />
                        )}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[15px] font-medium text-ink">
                          {entry.reason ||
                            (settlement
                              ? entry.kind === "received"
                                ? "Payment received"
                                : "You paid them"
                              : positive
                                ? "They borrowed"
                                : "You borrowed")}
                        </p>
                        <p className="mt-0.5 truncate text-[13px] text-ink-3">
                          {formatShortDate(entry.date)}
                          {entry.note ? ` · ${entry.note}` : ""}
                        </p>
                      </div>
                      <div className="text-right">
                        <span
                          className={`tnum block text-[15px] font-semibold ${
                            settlement
                              ? "text-ink"
                              : positive
                                ? "text-positive"
                                : "text-negative"
                          }`}
                        >
                          {settlement ? "" : positive ? "+" : "−"}
                          {formatMoney(entry.amount, currency)}
                        </span>
                        <span className="tnum text-[11px] text-ink-3">
                          bal {running === 0 ? formatMoney(0, currency) : `${running > 0 ? "+" : "−"}${formatMoney(Math.abs(running), currency)}`}
                        </span>
                      </div>
                    </div>
                  </SwipeRow>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </section>

      <ConfirmSheet
        open={pendingDelete !== null}
        title="Delete entry?"
        message={
          pendingDelete
            ? `The ${formatMoney(pendingDelete.amount, currency)} entry will be removed and the balance recalculated.`
            : ""
        }
        confirmLabel="Delete entry"
        onConfirm={() => {
          if (pendingDelete) void deleteEntry(pendingDelete.id);
          setPendingDelete(null);
        }}
        onCancel={() => setPendingDelete(null)}
      />

      <ConfirmSheet
        open={confirmPerson}
        title={`Delete ${person.name}?`}
        message={`All ${person.entryCount} ledger ${
          person.entryCount === 1 ? "entry" : "entries"
        } with ${person.name} will be permanently removed.`}
        confirmLabel="Delete person"
        onConfirm={() => {
          setConfirmPerson(false);
          void deletePerson(person.key);
          onBack();
        }}
        onCancel={() => setConfirmPerson(false)}
      />
    </div>
  );
}
