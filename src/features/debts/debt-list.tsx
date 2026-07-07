"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { SwipeRow } from "@/components/ui/swipe-row";
import { ConfirmSheet } from "@/components/ui/confirm-sheet";
import { formatMoney } from "@/lib/currency";
import { formatShortDate, isOverdue } from "@/lib/dates";
import { useData } from "@/lib/data-context";
import { useSettings } from "@/lib/settings";
import { useUI } from "@/lib/ui-store";
import type { Debt } from "@/lib/types";

const AVATAR_COLORS = [
  ["#c2410c", "rgba(234,88,12,0.12)"],
  ["#0369a1", "rgba(2,132,199,0.12)"],
  ["#6d28d9", "rgba(124,58,237,0.12)"],
  ["#be185d", "rgba(219,39,119,0.12)"],
  ["#0f766e", "rgba(13,148,136,0.12)"],
  ["#a16207", "rgba(202,138,4,0.12)"],
] as const;

function avatarColor(name: string) {
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) | 0;
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase();
}

export function DebtList({ debts }: { debts: Debt[] }) {
  const { deleteDebt, updateDebt } = useData();
  const currency = useSettings((s) => s.currency);
  const openSheet = useUI((s) => s.openSheet);
  const [pendingDelete, setPendingDelete] = useState<Debt | null>(null);

  return (
    <div className="overflow-hidden rounded-card bg-card">
      <AnimatePresence initial={false}>
        {debts.map((debt, i) => {
          const [fg, bg] = avatarColor(debt.person);
          const overdue = debt.status === "pending" && isOverdue(debt.dueDate);
          const settled = debt.status === "settled";
          return (
            <motion.div
              key={debt.id}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 40 }}
            >
              {i > 0 && <div className="ml-[68px] h-px bg-line" />}
              <SwipeRow
                onTap={() => openSheet({ kind: "debt", initial: debt })}
                actions={[
                  ...(debt.status === "pending"
                    ? [
                        {
                          label: "Settle",
                          icon: "settle" as const,
                          onAction: () =>
                            void updateDebt({ ...debt, status: "settled" }),
                        },
                      ]
                    : [
                        {
                          label: "Reopen",
                          icon: "edit" as const,
                          onAction: () =>
                            void updateDebt({ ...debt, status: "pending" }),
                        },
                      ]),
                  {
                    label: "Delete",
                    icon: "delete",
                    onAction: () => setPendingDelete(debt),
                  },
                ]}
              >
                <div
                  className={`flex items-center gap-3.5 px-4 py-3 ${
                    settled ? "opacity-50" : ""
                  }`}
                >
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[14px] font-semibold"
                    style={{ color: fg, background: bg }}
                    aria-hidden="true"
                  >
                    {initials(debt.person)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-medium text-ink">
                      {debt.person}
                    </p>
                    <p className="mt-0.5 truncate text-[13px] text-ink-3">
                      {debt.reason ? `${debt.reason} · ` : ""}
                      {settled ? (
                        "Settled"
                      ) : debt.dueDate ? (
                        <span className={overdue ? "font-medium text-negative" : ""}>
                          {overdue ? "Overdue · " : "Due "}
                          {formatShortDate(debt.dueDate)}
                        </span>
                      ) : (
                        formatShortDate(debt.date)
                      )}
                    </p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`tnum block text-[15px] font-semibold ${
                        settled
                          ? "text-ink-2 line-through decoration-ink-3"
                          : debt.type === "lent"
                            ? "text-positive"
                            : "text-negative"
                      }`}
                    >
                      {formatMoney(debt.amount, currency)}
                    </span>
                    <span className="text-[11px] font-medium uppercase tracking-wide text-ink-3">
                      {debt.type === "lent" ? "owes you" : "you owe"}
                    </span>
                  </div>
                </div>
              </SwipeRow>
            </motion.div>
          );
        })}
      </AnimatePresence>

      <ConfirmSheet
        open={pendingDelete !== null}
        title="Delete debt?"
        message={
          pendingDelete
            ? `The ${formatMoney(pendingDelete.amount, currency)} entry with ${pendingDelete.person} will be removed. This can't be undone.`
            : ""
        }
        confirmLabel="Delete"
        onConfirm={() => {
          if (pendingDelete) void deleteDebt(pendingDelete.id);
          setPendingDelete(null);
        }}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
