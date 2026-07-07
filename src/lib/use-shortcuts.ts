"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useUI } from "./ui-store";

const TAB_KEYS: Record<string, string> = {
  "1": "/",
  "2": "/analytics",
  "3": "/debts",
  "4": "/settings",
};

/**
 * Desktop keyboard shortcuts:
 *   1–4  switch tabs      n / e  new expense
 *   d    new debt entry   /      focus search (Debts)
 */
export function useShortcuts() {
  const router = useRouter();
  const pathname = usePathname();
  const { sheet, openSheet } = useUI();

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (sheet) return; // sheets own the keyboard while open
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      ) {
        return;
      }

      const key = event.key.toLowerCase();
      if (TAB_KEYS[key]) {
        router.push(TAB_KEYS[key]);
        return;
      }
      if (key === "n" || key === "e") {
        event.preventDefault();
        openSheet({ kind: "expense" });
        return;
      }
      if (key === "d") {
        event.preventDefault();
        openSheet({ kind: "entry" });
        return;
      }
      if (key === "/" && pathname === "/debts") {
        event.preventDefault();
        window.dispatchEvent(new Event("spent-focus-search"));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router, pathname, sheet, openSheet]);
}
