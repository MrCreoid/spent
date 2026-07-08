"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Sheet } from "@/components/ui/sheet";
import { AmountPad } from "./amount-pad";
import { Pressable } from "@/components/ui/pressable";
import { CATEGORY_ICONS, CheckIcon, PlusIcon, TagIcon } from "@/components/icons";
import { allCategories, isBuiltInCategory } from "@/lib/categories";
import { currencySymbol } from "@/lib/currency";
import { nowTime, todayISO, addDays, formatShortDate } from "@/lib/dates";
import { haptic } from "@/lib/haptics";
import { COLOR_PAIRS } from "@/lib/palette";
import { expenseSchema } from "@/lib/schemas";
import { useSettings } from "@/lib/settings";
import { useData } from "@/lib/data-context";
import { useDarkMode } from "@/components/theme";
import type { CategoryId, Expense } from "@/lib/types";

interface ExpenseSheetProps {
  open: boolean;
  initial?: Expense;
  onClose: () => void;
}

const COMMON_AMOUNTS = [50, 100, 200, 500];

export function ExpenseSheet({ open, initial, onClose }: ExpenseSheetProps) {
  const { addExpense, updateExpense, expenses, customCategories, addCategory } =
    useData();
  const { currency, lastCategory, setLastCategory } = useSettings();
  const dark = useDarkMode();

  const [amountStr, setAmountStr] = useState("");
  const [category, setCategory] = useState<CategoryId>(lastCategory);
  const [date, setDate] = useState(todayISO());
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [newCatOpen, setNewCatOpen] = useState(false);
  const [newCatLabel, setNewCatLabel] = useState("");
  const [newCatColor, setNewCatColor] = useState(0);

  // Reset form whenever the sheet opens
  useEffect(() => {
    if (!open) return;
    setError(null);
    setSaving(false);
    setNewCatOpen(false);
    setNewCatLabel("");
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

  // Recent amounts first, topped up with common ones — max 5 chips
  const quickAmounts = useMemo(() => {
    const seen = new Set<number>();
    const chips: number[] = [];
    for (const e of expenses) {
      if (!seen.has(e.amount)) {
        seen.add(e.amount);
        chips.push(e.amount);
        if (chips.length === 3) break;
      }
    }
    for (const a of COMMON_AMOUNTS) {
      if (chips.length >= 5) break;
      if (!seen.has(a)) {
        seen.add(a);
        chips.push(a);
      }
    }
    return chips;
  }, [expenses]);

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
          {allCategories(customCategories).map((meta) => {
            const CategoryIcon = isBuiltInCategory(meta.id)
              ? CATEGORY_ICONS[meta.id]
              : TagIcon;
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
          <Pressable
            aria-label="Create a new category"
            pressScale={0.93}
            onClick={() => {
              haptic(4);
              setNewCatOpen((v) => !v);
            }}
            className={`flex items-center gap-1 rounded-full py-[7px] pl-2.5 pr-3 text-[13px] font-medium transition-colors duration-150 ${
              newCatOpen ? "bg-accent-soft text-accent" : "bg-card-2 text-ink-2"
            }`}
          >
            <PlusIcon size={14} strokeWidth={2.2} />
            New
          </Pressable>
        </div>

        {/* Inline category creator */}
        {newCatOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mt-2 overflow-hidden"
          >
            <div className="flex items-center gap-2 rounded-2xl bg-card-2 p-2">
              <input
                type="text"
                value={newCatLabel}
                onChange={(e) => setNewCatLabel(e.target.value)}
                placeholder="Category name"
                maxLength={24}
                autoFocus
                className="min-w-0 flex-1 bg-transparent px-2 text-[14px] text-ink placeholder:text-ink-3"
                aria-label="New category name"
              />
              {COLOR_PAIRS.map(([fg, bg], i) => (
                <button
                  key={fg}
                  type="button"
                  aria-label={`Color ${i + 1}`}
                  onClick={() => setNewCatColor(i)}
                  className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-full"
                  style={{ background: bg, color: fg }}
                >
                  {newCatColor === i && <CheckIcon size={13} strokeWidth={2.6} />}
                </button>
              ))}
              <Pressable
                disabled={!newCatLabel.trim()}
                onClick={async () => {
                  const id = await addCategory(newCatLabel, newCatColor);
                  haptic(8);
                  setCategory(id);
                  setNewCatOpen(false);
                  setNewCatLabel("");
                }}
                className="shrink-0 rounded-xl bg-accent px-3 py-1.5 text-[13px] font-semibold text-white disabled:opacity-35"
              >
                Add
              </Pressable>
            </div>
          </motion.div>
        )}

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
            <span
              className={`block rounded-full px-3 py-[7px] text-[13px] font-medium transition-colors duration-150 ${
                date !== today && date !== yesterday
                  ? "bg-accent-soft text-accent"
                  : "bg-card-2 text-ink-2"
              }`}
              aria-hidden="true"
            >
              {date !== today && date !== yesterday
                ? formatShortDate(date)
                : "Other…"}
            </span>
            {/* Invisible native input on top: opens the platform date picker */}
            <input
              type="date"
              value={date}
              max={today}
              onChange={(e) => e.target.value && setDate(e.target.value)}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
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

        {/* Quick amounts */}
        {quickAmounts.length > 0 && (
          <div className="no-scrollbar mt-3 flex gap-1.5 overflow-x-auto">
            {quickAmounts.map((a) => (
              <Pressable
                key={a}
                onClick={() => {
                  haptic(4);
                  setAmountStr(String(a));
                }}
                className={`tnum shrink-0 rounded-full px-3.5 py-[7px] text-[13px] font-semibold transition-colors duration-150 ${
                  amountStr === String(a)
                    ? "bg-accent-soft text-accent"
                    : "bg-card-2 text-ink-2"
                }`}
              >
                {currencySymbol(currency)}
                {a}
              </Pressable>
            ))}
          </div>
        )}

        {/* Keypad */}
        <div className="mt-2">
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
