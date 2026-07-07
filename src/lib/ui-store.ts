"use client";

import { create } from "zustand";
import type { Debt, Expense } from "./types";

export type ActiveSheet =
  | { kind: "expense"; initial?: Expense }
  | { kind: "debt"; initial?: Debt }
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
