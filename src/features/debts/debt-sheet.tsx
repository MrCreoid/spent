"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Sheet } from "@/components/ui/sheet";
import { Pressable } from "@/components/ui/pressable";
import { Segmented } from "@/components/ui/segmented";
import { currencySymbol } from "@/lib/currency";
import { todayISO } from "@/lib/dates";
import { haptic } from "@/lib/haptics";
import { debtSchema, type DebtFormValues } from "@/lib/schemas";
import { useData } from "@/lib/data-context";
import { useSettings } from "@/lib/settings";
import type { Debt } from "@/lib/types";

interface DebtSheetProps {
  open: boolean;
  initial?: Debt;
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

export function DebtSheet({ open, initial, onClose }: DebtSheetProps) {
  const { addDebt, updateDebt } = useData();
  const currency = useSettings((s) => s.currency);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<DebtFormValues>({
    resolver: zodResolver(debtSchema),
    defaultValues: {
      person: "",
      type: "lent",
      date: todayISO(),
      status: "pending",
    },
  });

  useEffect(() => {
    if (!open) return;
    reset(
      initial
        ? {
            person: initial.person,
            amount: initial.amount,
            type: initial.type,
            reason: initial.reason ?? "",
            date: initial.date,
            dueDate: initial.dueDate ?? "",
            status: initial.status,
          }
        : {
            person: "",
            amount: undefined,
            type: "lent",
            reason: "",
            date: todayISO(),
            dueDate: "",
            status: "pending",
          }
    );
  }, [open, initial, reset]);

  const type = watch("type");

  const onSubmit = async (values: DebtFormValues) => {
    const payload = {
      ...values,
      reason: values.reason?.trim() || undefined,
      dueDate: values.dueDate || undefined,
    };
    try {
      if (initial) {
        await updateDebt({ ...initial, ...payload });
      } else {
        await addDebt(payload);
      }
      haptic(10);
      onClose();
    } catch {
      // keep the sheet open; the form stays intact
    }
  };

  return (
    <Sheet open={open} onClose={onClose} ariaLabel={initial ? "Edit debt" : "Add debt"}>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 pb-4 pt-1">
        <h2 className="text-[15px] font-semibold text-ink-2">
          {initial ? "Edit debt" : "New debt"}
        </h2>

        <Segmented
          ariaLabel="Debt direction"
          options={[
            { value: "lent", label: "They owe me" },
            { value: "borrowed", label: "I owe them" },
          ]}
          value={type}
          onChange={(v) => setValue("type", v, { shouldValidate: true })}
        />

        <Field label="Person" error={errors.person?.message}>
          <input
            {...register("person")}
            placeholder="Name"
            autoComplete="off"
            className={inputClass}
          />
        </Field>

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

        <Field label="Reason" error={errors.reason?.message}>
          <input
            {...register("reason")}
            placeholder="Dinner, movie tickets… (optional)"
            autoComplete="off"
            className={inputClass}
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Date" error={errors.date?.message}>
            <input {...register("date")} type="date" max={todayISO()} className={inputClass} />
          </Field>
          <Field label="Due date" error={errors.dueDate?.message}>
            <input {...register("dueDate")} type="date" className={inputClass} />
          </Field>
        </div>

        {initial && (
          <Segmented
            ariaLabel="Status"
            options={[
              { value: "pending", label: "Pending" },
              { value: "settled", label: "Settled" },
            ]}
            value={watch("status")}
            onChange={(v) => setValue("status", v, { shouldValidate: true })}
          />
        )}

        <Pressable
          type="submit"
          disabled={isSubmitting}
          className="mt-1 h-[52px] w-full rounded-2xl bg-accent text-[17px] font-semibold text-white transition-opacity duration-200 disabled:opacity-35"
        >
          {isSubmitting ? "Saving…" : initial ? "Save changes" : "Add debt"}
        </Pressable>
      </form>
    </Sheet>
  );
}
