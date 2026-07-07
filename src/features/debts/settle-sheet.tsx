"use client";

import { useEffect, useMemo, useState } from "react";
import { Sheet } from "@/components/ui/sheet";
import { Pressable } from "@/components/ui/pressable";
import { PersonAvatar } from "./avatar";
import { formatMoney, currencySymbol } from "@/lib/currency";
import { todayISO } from "@/lib/dates";
import { haptic } from "@/lib/haptics";
import { buildPeople } from "@/lib/ledger";
import { useData } from "@/lib/data-context";
import { useSettings } from "@/lib/settings";

interface SettleSheetProps {
  open: boolean;
  personKey: string;
  onClose: () => void;
}

/**
 * Records a full or partial settlement. Direction is inferred from the
 * balance: they pay you (received) or you pay them (paid).
 */
export function SettleSheet({ open, personKey, onClose }: SettleSheetProps) {
  const { entries, addEntry } = useData();
  const currency = useSettings((s) => s.currency);

  const person = useMemo(
    () => buildPeople(entries).find((p) => p.key === personKey) ?? null,
    [entries, personKey]
  );

  const balance = person?.balance ?? 0;
  const owesMe = balance > 0;
  const full = Math.abs(balance);

  const [amountStr, setAmountStr] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setAmountStr(String(full));
      setSaving(false);
      setError(null);
    }
    // Re-prime the field only when the sheet opens
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, personKey]);

  if (!person) return null;

  const amount = parseFloat(amountStr);
  const valid = Number.isFinite(amount) && amount > 0 && amount <= full + 0.001;
  const remaining = valid ? Math.round((full - amount) * 100) / 100 : full;

  const save = async () => {
    if (!valid) {
      setError(
        amount > full
          ? `That's more than the ${formatMoney(full, currency)} outstanding.`
          : "Enter an amount."
      );
      haptic([20, 40, 20]);
      return;
    }
    setSaving(true);
    try {
      await addEntry({
        person: person.name,
        amount: Math.round(amount * 100) / 100,
        kind: owesMe ? "received" : "paid",
        reason: amount >= full ? "Settled in full" : "Partial settlement",
        date: todayISO(),
      });
      haptic(10);
      onClose();
    } catch {
      setError("Couldn't save. Please try again.");
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onClose={onClose} ariaLabel={`Settle up with ${person.name}`}>
      <div className="flex flex-col gap-4 pb-4 pt-1">
        <div className="flex items-center gap-3">
          <PersonAvatar name={person.name} size={40} />
          <div>
            <h2 className="text-[16px] font-semibold text-ink">Settle up</h2>
            <p className="text-[13px] text-ink-2">
              {owesMe
                ? `${person.name} owes you ${formatMoney(full, currency)}`
                : `You owe ${person.name} ${formatMoney(full, currency)}`}
            </p>
          </div>
        </div>

        {error && (
          <p
            className="rounded-xl bg-negative-soft px-4 py-2.5 text-[13px] font-medium text-negative"
            role="alert"
          >
            {error}
          </p>
        )}

        <label className="block">
          <span className="mb-1.5 block px-1 text-[13px] font-semibold text-ink-2">
            {owesMe ? "Amount received" : "Amount paid"}
          </span>
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-[16px] text-ink-3">
              {currencySymbol(currency)}
            </span>
            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              value={amountStr}
              onChange={(e) => {
                setAmountStr(e.target.value);
                setError(null);
              }}
              className="tnum w-full rounded-xl bg-card-2 px-4 py-3 pl-9 text-[16px] text-ink placeholder:text-ink-3"
              aria-label="Settlement amount"
            />
          </div>
        </label>

        <div className="flex gap-1.5">
          {[
            { label: "Full amount", value: full },
            { label: "Half", value: Math.round((full / 2) * 100) / 100 },
          ].map((chip) => (
            <Pressable
              key={chip.label}
              onClick={() => {
                haptic(4);
                setAmountStr(String(chip.value));
                setError(null);
              }}
              className={`rounded-full px-3.5 py-[7px] text-[13px] font-medium transition-colors duration-150 ${
                amountStr === String(chip.value)
                  ? "bg-accent-soft text-accent"
                  : "bg-card-2 text-ink-2"
              }`}
            >
              {chip.label}
            </Pressable>
          ))}
        </div>

        <div className="flex items-center justify-between rounded-xl bg-card-2 px-4 py-3">
          <span className="text-[13px] font-medium text-ink-2">
            Remaining after this
          </span>
          <span className="tnum text-[15px] font-semibold text-ink">
            {formatMoney(Math.max(remaining, 0), currency)}
          </span>
        </div>

        <Pressable
          onClick={save}
          disabled={saving}
          className="h-[52px] w-full rounded-2xl bg-positive text-[17px] font-semibold text-white transition-opacity duration-200 disabled:opacity-35"
        >
          {saving
            ? "Saving…"
            : owesMe
              ? "Record payment received"
              : "Record payment made"}
        </Pressable>
      </div>
    </Sheet>
  );
}
