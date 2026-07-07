"use client";

import { useEffect, useState } from "react";
import { useSettings } from "@/lib/settings";

function resolveDark(theme: string): boolean {
  if (theme === "dark") return true;
  if (theme === "light") return false;
  return typeof window !== "undefined"
    ? window.matchMedia("(prefers-color-scheme: dark)").matches
    : true;
}

/** Applies the theme class + status-bar color; renders nothing */
export function ThemeSync() {
  const theme = useSettings((s) => s.theme);

  useEffect(() => {
    const apply = () => {
      const dark = resolveDark(theme);
      document.documentElement.classList.toggle("dark", dark);
      const meta = document.querySelector('meta[name="theme-color"]');
      meta?.setAttribute("content", dark ? "#0a0b0d" : "#f6f6f7");
      window.dispatchEvent(new Event("spent-theme"));
    };
    apply();
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, [theme]);

  return null;
}

/** Reactive dark-mode flag for components that need raw color values (charts, tints) */
export function useDarkMode(): boolean {
  const [dark, setDark] = useState(true);
  useEffect(() => {
    const read = () => setDark(document.documentElement.classList.contains("dark"));
    read();
    window.addEventListener("spent-theme", read);
    return () => window.removeEventListener("spent-theme", read);
  }, []);
  return dark;
}
