"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Sheet } from "@/components/ui/sheet";
import { AmountPad } from "./amount-pad";
import { Pressable } from "@/components/ui/pressable";
import { CATEGORY_ICONS } from "@/components/icons";
import { CATEGORY_LIST } from "@/lib/categories";
import { currencySymbol } from "@/lib/currency";
import { nowTime, todayISO, addDays, formatShortDate } from "@/lib/dates";
import { haptic } from "@/lib/haptics";
import { expenseSchema } from "@/lib/schemas";
import { useSettings } from "@/lib/settings";
import { useData } from "@/lib/data-context";
import { useDarkMode } from "@/components/theme";
import type { Category, Expense } from "@/lib/types";

interface ExpenseSheetProps {
  open: boolean;
  initial?: Expense;
  onClose: () => void;
}

export function ExpenseSheet({ open, initial, onClose }: ExpenseSheetProps) {
  const { addExpense, updateExpense } = useData();
  const { currency, lastCategory, setLastCategory } = useSettings();
  const dark = useDarkMode();

  const [amountStr, setAmountStr] = useState("");
  const [category, setCategory] = useState<Category>(lastCategory);
  const [date, setDate] = useState(todayISO());
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const dateInputRef = useRef<HTMLInputElement>(null);

  // Reset form whenever the sheet opens
  useEffect(() => {
    if (!open) return;
    setError(null);
    setSaving(false);
    if (initial) {
      setAmountStr(String(initial.amount));
      setCategory(initial.category);
      setDate(initial.date);
      setNote(initial.note ?? "");
    } else {
      setAmountStr("");
      setCategory(lastCategory);
      setDate(todayISO());
      setNote("");
    }
    // lastCategory intentionally read once per open
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initial]);

  const amount = useMemo(() => {
    const n = parseFloat(amountStr);
    return Number.isFinite(n) ? n : 0;
  }, [amountStr]);

  const symbol = currencySymbol(currency);
  const today = todayISO();
  const yesterday = addDays(today, -1);

  const save = async () => {
    const payload = {
      amount,
      category,
      date,
      time: initial?.time ?? nowTime(),
      note: note.trim() || undefined,
    };
    const result = expenseSchema.safeParse(payload);
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? "Check the details");
      haptic([20, 40, 20]);
      return;
    }
    setSaving(true);
    try {
      if (initial) {
        await updateExpense({ ...initial, ...result.data });
      } else {
        await addExpense(result.data);
        setLastCategory(category);
      }
      haptic(10);
      onClose();
    } catch {
      setError("Couldn't save. Please try again.");
      setSaving(false);
    }
  };

  // Format the typed amount with grouping while keeping raw decimals visible
  const displayAmount = useMemo(() => {
    if (!amountStr) return "0";
    const [whole = "0", frac] = amountStr.split(".");
    const grouped = new Intl.NumberFormat(
      currency === "INR" ? "en-IN" : undefined
    ).format(Number(whole || "0"));
    return frac !== undefined ? `${grouped}.${frac}` : grouped;
  }, [amountStr, currency]);

  return (
    <Sheet
      open={open}
      onClose={onClose}
      ariaLabel={initial ? "Edit expense" : "Add expense"}
    >
      <div className="pb-4">
        <div className="flex items-center justify-between pt-1">
          <h2 className="text-[15px] font-semibold text-ink-2">
            {initial ? "Edit expense" : "New expense"}
          </h2>
          {error && (
            <motion.span
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-[13px] font-medium text-negative"
              role="alert"
            >
              {error}
            </motion.span>
          )}
        </div>

        {/* Amount */}
        <div
          className="tnum mt-3 flex items-baseline justify-center gap-1.5 py-2"
          aria-live="polite"
          aria-label={`Amount ${symbol}${displayAmount}`}
        >
          <span className="text-[26px] font-medium text-ink-3">{symbol}</span>
          <span
            className={`text-[54px] font-semibold leading-none tracking-tight ${
              amountStr ? "text-ink" : "text-ink-3"
            }`}
          >
            {displayAmount}
          </span>
        </div>

        {/* Categories */}
        <div
          className="mt-2 flex flex-wrap justify-center gap-1.5"
          role="radiogroup"
          aria-label="Category"
        >
          {CATEGORY_LIST.map((meta) => {
            const CategoryIcon = CATEGORY_ICONS[meta.id];
            const active = category === meta.id;
            const idx = dark ? 1 : 0;
            return (
              <Pressable
                key={meta.id}
                role="radio"
                aria-checked={active}
                pressScale={0.93}
                onClick={() => {
                  haptic(4);
                  setCategory(meta.id);
                }}
                className="flex items-center gap-1.5 rounded-full py-[7px] pl-2.5 pr-3 text-[13px] font-medium transition-colors duration-150"
                style={
                  active
                    ? { background: meta.tint[idx], color: meta.color[idx] }
                    : { background: "var(--card-2)", color: "var(--text-2)" }
                }
              >
                <CategoryIcon size={16} strokeWidth={2} />
                {meta.label}
              </Pressable>
            );
          })}
        </div>

        {/* Date + note */}
        <div className="mt-4 flex items-center gap-1.5">
          {[
            { label: "Today", value: today },
            { label: "Yesterday", value: yesterday },
          ].map((chip) => (
            <Pressable
              key={chip.label}
              onClick={() => {
                haptic(4);
                setDate(chip.value);
              }}
              className={`rounded-full px-3 py-[7px] text-[13px] font-medium transition-colors duration-150 ${
                date === chip.value
                  ? "bg-accent-soft text-accent"
                  : "bg-card-2 text-ink-2"
              }`}
            >
              {chip.label}
            </Pressable>
          ))}
          <div className="relative">
            <Pressable
              onClick={() => dateInputRef.current?.showPicker?.()}
              className={`rounded-full px-3 py-[7px] text-[13px] font-medium transition-colors duration-150 ${
                date !== today && date !== yesterday
                  ? "bg-accent-soft text-accent"
                  : "bg-card-2 text-ink-2"
              }`}
            >
              {date !== today && date !== yesterday
                ? formatShortDate(date)
                : "Other…"}
            </Pressable>
            <input
              ref={dateInputRef}
              type="date"
              value={date}
              max={today}
              onChange={(e) => e.target.value && setDate(e.target.value)}
              className="absolute inset-0 h-full w-full opacity-0"
              style={{ pointerEvents: "none" }}
              tabIndex={-1}
              aria-label="Pick a date"
            />
          </div>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Note"
            maxLength={140}
            className="min-w-0 flex-1 rounded-full bg-card-2 px-3.5 py-[7px] text-[13px] font-medium text-ink placeholder:text-ink-3"
            aria-label="Note (optional)"
          />
        </div>

        {/* Keypad */}
        <div className="mt-3">
          <AmountPad value={amountStr} onChange={setAmountStr} />
        </div>

        <Pressable
          onClick={save}
          disabled={saving || amount <= 0}
          className="mt-3 h-[52px] w-full rounded-2xl bg-accent text-[17px] font-semibold text-white transition-opacity duration-200 disabled:opacity-35"
        >
          {saving ? "Saving…" : initial ? "Save changes" : "Add expense"}
        </Pressable>
      </div>
    </Sheet>
  );
}
