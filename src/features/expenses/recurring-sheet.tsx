"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Sheet } from "@/components/ui/sheet";
import { Pressable } from "@/components/ui/pressable";
import { allCategories } from "@/lib/categories";
import { currencySymbol } from "@/lib/currency";
import { haptic } from "@/lib/haptics";
import { recurringSchema, type RecurringFormValues } from "@/lib/schemas";
import { useData } from "@/lib/data-context";
import { useSettings } from "@/lib/settings";

interface RecurringSheetProps {
  open: boolean;
  onClose: () => void;
}

const inputClass =
  "w-full rounded-xl bg-card-2 px-4 py-3 text-[16px] text-ink placeholder:text-ink-3";

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-baseline justify-between px-1">
        <span className="text-[13px] font-semibold text-ink-2">{label}</span>
        {error && (
          <span className="text-[12px] font-medium text-negative" role="alert">
            {error}
          </span>
        )}
      </span>
      {children}
    </label>
  );
}

/** Set up a monthly autopay expense (rent, subscriptions, hostel mess…) */
export function RecurringSheet({ open, onClose }: RecurringSheetProps) {
  const { addRecurring, customCategories } = useData();
  const currency = useSettings((s) => s.currency);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<RecurringFormValues>({
    resolver: zodResolver(recurringSchema),
    defaultValues: { category: "misc", dayOfMonth: 1 },
  });

  useEffect(() => {
    if (open) reset({ amount: undefined, category: "misc", dayOfMonth: 1, note: "" });
  }, [open, reset]);

  const onSubmit = async (values: RecurringFormValues) => {
    try {
      await addRecurring(values);
      haptic(10);
      onClose();
    } catch {
      // keep the sheet open
    }
  };

  return (
    <Sheet open={open} onClose={onClose} ariaLabel="New autopay expense">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 pb-4 pt-1">
        <div>
          <h2 className="text-[15px] font-semibold text-ink-2">New autopay</h2>
          <p className="mt-1 text-[13px] leading-relaxed text-ink-3">
            Added automatically every month on the day you pick — rent,
            subscriptions, mess fees.
          </p>
        </div>

        <Field label="Name" error={errors.note?.message}>
          <input
            {...register("note")}
            placeholder="Rent, Netflix, Mess…"
            autoComplete="off"
            className={inputClass}
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Amount" error={errors.amount?.message}>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-[16px] text-ink-3">
                {currencySymbol(currency)}
              </span>
              <input
                {...register("amount", { valueAsNumber: true })}
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                placeholder="0"
                className={`${inputClass} tnum pl-9`}
              />
            </div>
          </Field>
          <Field label="Day of month" error={errors.dayOfMonth?.message}>
            <input
              {...register("dayOfMonth", { valueAsNumber: true })}
              type="number"
              inputMode="numeric"
              min={1}
              max={31}
              className={`${inputClass} tnum`}
            />
          </Field>
        </div>

        <Field label="Category" error={errors.category?.message}>
          <select {...register("category")} className={`${inputClass} appearance-none`}>
            {allCategories(customCategories).map((meta) => (
              <option key={meta.id} value={meta.id}>
                {meta.label}
              </option>
            ))}
          </select>
        </Field>

        <Pressable
          type="submit"
          disabled={isSubmitting}
          className="mt-1 h-[52px] w-full rounded-2xl bg-accent text-[17px] font-semibold text-white transition-opacity duration-200 disabled:opacity-35"
        >
          {isSubmitting ? "Saving…" : "Start autopay"}
        </Pressable>
      </form>
    </Sheet>
  );
}
