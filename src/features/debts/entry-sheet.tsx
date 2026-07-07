"use client";

import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Sheet } from "@/components/ui/sheet";
import { Pressable } from "@/components/ui/pressable";
import { Segmented } from "@/components/ui/segmented";
import { currencySymbol } from "@/lib/currency";
import { todayISO } from "@/lib/dates";
import { haptic } from "@/lib/haptics";
import { isSettlement } from "@/lib/ledger";
import { entrySchema, type EntryFormValues } from "@/lib/schemas";
import { useData } from "@/lib/data-context";
import { useSettings } from "@/lib/settings";
import type { LedgerEntry } from "@/lib/types";

interface EntrySheetProps {
  open: boolean;
  /** Editing an existing entry */
  initial?: LedgerEntry;
  /** Adding from inside a ledger: person is fixed */
  person?: string;
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

export function EntrySheet({ open, initial, person, onClose }: EntrySheetProps) {
  const { people, addEntry, updateEntry } = useData();
  const currency = useSettings((s) => s.currency);

  // Existing people for the name autocomplete
  const peopleNames = useMemo(() => people.map((p) => p.name), [people]);

  const editingSettlement = initial ? isSettlement(initial.kind) : false;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<EntryFormValues>({
    resolver: zodResolver(entrySchema),
    defaultValues: { person: "", kind: "lent", date: todayISO() },
  });

  useEffect(() => {
    if (!open) return;
    reset(
      initial
        ? {
            person: initial.person,
            amount: initial.amount,
            // Settlement entries keep their kind; the field is hidden
            kind: isSettlement(initial.kind)
              ? initial.kind === "received"
                ? "lent"
                : "borrowed"
              : initial.kind,
            reason: initial.reason ?? "",
            date: initial.date,
            note: initial.note ?? "",
          }
        : {
            person: person ?? "",
            amount: undefined,
            kind: "lent",
            reason: "",
            date: todayISO(),
            note: "",
          }
    );
  }, [open, initial, person, reset]);

  const kind = watch("kind");

  const onSubmit = async (values: EntryFormValues) => {
    const payload = {
      person: values.person,
      amount: values.amount,
      kind: editingSettlement && initial ? initial.kind : values.kind,
      reason: values.reason?.trim() || undefined,
      note: values.note?.trim() || undefined,
      date: values.date,
    };
    try {
      if (initial) {
        await updateEntry({ ...initial, ...payload });
      } else {
        await addEntry(payload);
      }
      haptic(10);
      onClose();
    } catch {
      // keep the sheet open; the form stays intact
    }
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      ariaLabel={initial ? "Edit entry" : "Add ledger entry"}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 pb-4 pt-1">
        <h2 className="text-[15px] font-semibold text-ink-2">
          {initial
            ? editingSettlement
              ? "Edit settlement"
              : "Edit entry"
            : "New entry"}
        </h2>

        {!editingSettlement && (
          <Segmented
            ariaLabel="Direction"
            options={[
              { value: "lent", label: "They owe me" },
              { value: "borrowed", label: "I owe them" },
            ]}
            value={kind}
            onChange={(v) => setValue("kind", v, { shouldValidate: true })}
          />
        )}

        <Field label="Person" error={errors.person?.message}>
          <input
            {...register("person")}
            placeholder="Name"
            autoComplete="off"
            list="spent-people"
            disabled={Boolean(person) || Boolean(initial)}
            className={`${inputClass} disabled:opacity-60`}
          />
          <datalist id="spent-people">
            {peopleNames.map((name) => (
              <option key={name} value={name} />
            ))}
          </datalist>
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

        <div className="grid grid-cols-2 gap-3">
          <Field label="Reason" error={errors.reason?.message}>
            <input
              {...register("reason")}
              placeholder="Dinner, tickets…"
              autoComplete="off"
              className={inputClass}
            />
          </Field>
          <Field label="Date" error={errors.date?.message}>
            <input
              {...register("date")}
              type="date"
              max={todayISO()}
              className={inputClass}
            />
          </Field>
        </div>

        <Field label="Note" error={errors.note?.message}>
          <input
            {...register("note")}
            placeholder="Anything worth remembering (optional)"
            autoComplete="off"
            className={inputClass}
          />
        </Field>

        <Pressable
          type="submit"
          disabled={isSubmitting}
          className="mt-1 h-[52px] w-full rounded-2xl bg-accent text-[17px] font-semibold text-white transition-opacity duration-200 disabled:opacity-35"
        >
          {isSubmitting ? "Saving…" : initial ? "Save changes" : "Add entry"}
        </Pressable>
      </form>
    </Sheet>
  );
}
