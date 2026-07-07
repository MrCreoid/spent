"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Sheet } from "@/components/ui/sheet";
import { Pressable } from "@/components/ui/pressable";
import { Segmented } from "@/components/ui/segmented";
import { PersonAvatar } from "./avatar";
import { formatMoney, currencySymbol } from "@/lib/currency";
import { todayISO } from "@/lib/dates";
import { haptic } from "@/lib/haptics";
import { useData } from "@/lib/data-context";
import { useSettings } from "@/lib/settings";
import type { EntryKind } from "@/lib/types";

interface QuickAdjustSheetProps {
  open: boolean;
  personKey: string;
  onClose: () => void;
}

const CHIP_AMOUNTS = [10, 20, 50, 100, 200, 500];

type Direction = "repay" | "increase";

/**
 * The fastest action in the debt section: one tap records a small
 * repayment — or a little more borrowed — no reason, no form.
 */
export function QuickAdjustSheet({ open, personKey, onClose }: QuickAdjustSheetProps) {
  const { people, addEntry } = useData();
  const currency = useSettings((s) => s.currency);

  const person = useMemo(
    () => people.find((p) => p.key === personKey) ?? null,
    [people, personKey]
  );

  const [direction, setDirection] = useState<Direction>("repay");
  const [customOpen, setCustomOpen] = useState(false);
  const [customStr, setCustomStr] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setDirection("repay");
      setCustomOpen(false);
      setCustomStr("");
      setBusy(false);
      setError(null);
    }
  }, [open, personKey]);

  if (!person) return null;

  const balance = person.balance;
  const owesMe = balance > 0;
  const full = Math.abs(balance);
  const repaying = direction === "repay";

  // Effect on |balance|: repay shrinks it, increase grows it
  const kind: EntryKind = owesMe
    ? repaying
      ? "received"
      : "lent"
    : repaying
      ? "paid"
      : "borrowed";

  const record = async (amount: number) => {
    if (busy) return;
    if (!(amount > 0)) {
      setError("Enter an amount.");
      haptic([20, 40, 20]);
      return;
    }
    if (repaying && amount > full + 0.001) {
      setError(`Keep it within the ${formatMoney(full, currency)} outstanding.`);
      haptic([20, 40, 20]);
      return;
    }
    setBusy(true);
    try {
      await addEntry({
        person: person.name,
        amount: Math.round(amount * 100) / 100,
        kind,
        date: todayISO(),
      });
      haptic(10);
      onClose();
    } catch {
      setError("Couldn't save. Please try again.");
      setBusy(false);
    }
  };

  const chips = repaying
    ? CHIP_AMOUNTS.filter((a) => a <= full)
    : CHIP_AMOUNTS;
  const sign = repaying ? "−" : "+";

  const helper = repaying
    ? owesMe
      ? "They gave you some money back"
      : "You paid some of it back"
    : owesMe
      ? "They borrowed a little more"
      : "You borrowed a little more";

  return (
    <Sheet open={open} onClose={onClose} ariaLabel={`Quick adjust for ${person.name}`}>
      <div className="flex flex-col gap-4 pb-4 pt-1">
        <div className="flex items-center gap-3">
          <PersonAvatar name={person.name} size={40} color={person.color} />
          <div>
            <h2 className="text-[16px] font-semibold text-ink">Quick adjust</h2>
            <p className="text-[13px] text-ink-2">
              <span className="tnum font-medium">{formatMoney(full, currency)}</span>{" "}
              outstanding · {helper.toLowerCase()}
            </p>
          </div>
        </div>

        <Segmented
          ariaLabel="Adjustment direction"
          options={[
            {
              value: "repay",
              label: owesMe ? "− They paid back" : "− You paid back",
            },
            {
              value: "increase",
              label: owesMe ? "+ Borrowed more" : "+ You borrowed",
            },
          ]}
          value={direction}
          onChange={(v) => {
            setDirection(v);
            setError(null);
          }}
        />

        {error && (
          <p
            className="rounded-xl bg-negative-soft px-4 py-2.5 text-[13px] font-medium text-negative"
            role="alert"
          >
            {error}
          </p>
        )}

        <div className="grid grid-cols-3 gap-2">
          {chips.map((amount, i) => (
            <motion.div
              key={`${direction}-${amount}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03, type: "spring", stiffness: 400, damping: 30 }}
            >
              <Pressable
                onClick={() => void record(amount)}
                disabled={busy}
                pressScale={0.93}
                className="tnum h-[52px] w-full rounded-2xl bg-card-2 text-[17px] font-semibold text-ink transition-colors duration-150 hover:bg-press disabled:opacity-40"
              >
                {sign}
                {formatMoney(amount, currency)}
              </Pressable>
            </motion.div>
          ))}
          {repaying && (
            <motion.div
              key="full"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: chips.length * 0.03, type: "spring", stiffness: 400, damping: 30 }}
            >
              <Pressable
                onClick={() => void record(full)}
                disabled={busy}
                pressScale={0.93}
                className="tnum h-[52px] w-full rounded-2xl bg-positive-soft text-[15px] font-semibold text-positive transition-colors duration-150 disabled:opacity-40"
              >
                Clear {formatMoney(full, currency)}
              </Pressable>
            </motion.div>
          )}
        </div>

        {customOpen ? (
          <div className="flex gap-2">
            <div className="relative flex-1">
              <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-[16px] text-ink-3">
                {sign} {currencySymbol(currency)}
              </span>
              <input
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                autoFocus
                value={customStr}
                onChange={(e) => {
                  setCustomStr(e.target.value);
                  setError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void record(parseFloat(customStr));
                }}
                placeholder="0"
                className="tnum w-full rounded-2xl bg-card-2 px-4 py-3 pl-12 text-[16px] text-ink placeholder:text-ink-3"
                aria-label="Custom amount"
              />
            </div>
            <Pressable
              onClick={() => void record(parseFloat(customStr))}
              disabled={busy}
              className="rounded-2xl bg-accent px-5 text-[15px] font-semibold text-white disabled:opacity-40"
            >
              Save
            </Pressable>
          </div>
        ) : (
          <button
            onClick={() => setCustomOpen(true)}
            className="cursor-pointer py-1 text-center text-[14px] font-medium text-accent"
          >
            Custom amount…
          </button>
        )}

        <p className="text-center text-[12px] text-ink-3">
          Recorded instantly with today's date. Use “Add entry” for anything
          with details.
        </p>
      </div>
    </Sheet>
  );
}
