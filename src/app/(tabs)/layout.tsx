"use client";

import type { ReactNode } from "react";
import { TabBar } from "@/components/nav/tab-bar";
import { Fab } from "@/components/nav/fab";
import { ExpenseSheet } from "@/features/expenses/expense-sheet";
import { EntrySheet } from "@/features/debts/entry-sheet";
import { SettleSheet } from "@/features/debts/settle-sheet";
import { QuickAdjustSheet } from "@/features/debts/quick-adjust-sheet";
import { PersonSheet } from "@/features/debts/person-sheet";
import { useUI } from "@/lib/ui-store";
import { useShortcuts } from "@/lib/use-shortcuts";

export default function TabsLayout({ children }: { children: ReactNode }) {
  const { sheet, closeSheet } = useUI();
  useShortcuts();

  return (
    <>
      <main className="min-h-dvh lg:ml-[224px]">
        <div className="mx-auto w-full max-w-lg px-4 pt-safe pb-[calc(96px+env(safe-area-inset-bottom))] lg:max-w-5xl lg:px-10 lg:pb-16 lg:pt-4">
          {children}
        </div>
      </main>
      <Fab />
      <TabBar />
      <ExpenseSheet
        open={sheet?.kind === "expense"}
        initial={sheet?.kind === "expense" ? sheet.initial : undefined}
        onClose={closeSheet}
      />
      <EntrySheet
        open={sheet?.kind === "entry"}
        initial={sheet?.kind === "entry" ? sheet.initial : undefined}
        person={sheet?.kind === "entry" ? sheet.person : undefined}
        onClose={closeSheet}
      />
      <SettleSheet
        open={sheet?.kind === "settle"}
        personKey={sheet?.kind === "settle" ? sheet.personKey : ""}
        onClose={closeSheet}
      />
      <QuickAdjustSheet
        open={sheet?.kind === "quickAdjust"}
        personKey={sheet?.kind === "quickAdjust" ? sheet.personKey : ""}
        onClose={closeSheet}
      />
      <PersonSheet open={sheet?.kind === "person"} onClose={closeSheet} />
    </>
  );
}
