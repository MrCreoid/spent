"use client";

import { create } from "zustand";
import type { Expense, LedgerEntry } from "./types";

export type ActiveSheet =
  | { kind: "expense"; initial?: Expense }
  | { kind: "entry"; initial?: LedgerEntry; person?: string }
  | { kind: "settle"; personKey: string }
  | { kind: "quickAdjust"; personKey: string }
  | { kind: "person" }
  | null;

interface UIStore {
  sheet: ActiveSheet;
  openSheet: (sheet: NonNullable<ActiveSheet>) => void;
  closeSheet: () => void;
}

export const useUI = create<UIStore>((set) => ({
  sheet: null,
  openSheet: (sheet) => set({ sheet }),
  closeSheet: () => set({ sheet: null }),
}));
