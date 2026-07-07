"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Category, Settings, Theme } from "./types";

interface SettingsStore extends Settings {
  setTheme: (theme: Theme) => void;
  setCurrency: (currency: string) => void;
  setLastCategory: (category: Category) => void;
}

export const useSettings = create<SettingsStore>()(
  persist(
    (set) => ({
      theme: "system",
      currency: "INR",
      lastCategory: "food",
      setTheme: (theme) => set({ theme }),
      setCurrency: (currency) => set({ currency }),
      setLastCategory: (lastCategory) => set({ lastCategory }),
    }),
    { name: "spent-settings" }
  )
);
