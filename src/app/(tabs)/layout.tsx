"use client";

import type { ReactNode } from "react";
import { TabBar } from "@/components/nav/tab-bar";
import { Fab } from "@/components/nav/fab";
import { ExpenseSheet } from "@/features/expenses/expense-sheet";
import { DebtSheet } from "@/features/debts/debt-sheet";
import { useUI } from "@/lib/ui-store";

export default function TabsLayout({ children }: { children: ReactNode }) {
  const { sheet, closeSheet } = useUI();

  return (
    <>
      <main className="mx-auto min-h-dvh w-full max-w-lg px-4 pt-safe pb-[calc(96px+env(safe-area-inset-bottom))]">
        {children}
      </main>
      <Fab />
      <TabBar />
      <ExpenseSheet
        open={sheet?.kind === "expense"}
        initial={sheet?.kind === "expense" ? sheet.initial : undefined}
        onClose={closeSheet}
      />
      <DebtSheet
        open={sheet?.kind === "debt"}
        initial={sheet?.kind === "debt" ? sheet.initial : undefined}
        onClose={closeSheet}
      />
    </>
  );
}
