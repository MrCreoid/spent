"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  DebtsIcon,
  ListIcon,
  PlusIcon,
  UserPlusIcon,
} from "@/components/icons";
import { useUI, type ActiveSheet } from "@/lib/ui-store";
import { haptic } from "@/lib/haptics";

const ACTIONS: {
  label: string;
  icon: typeof ListIcon;
  sheet: NonNullable<ActiveSheet>;
}[] = [
  { label: "Add person", icon: UserPlusIcon, sheet: { kind: "person" } },
  { label: "Debt entry", icon: DebtsIcon, sheet: { kind: "entry" } },
  { label: "Expense", icon: ListIcon, sheet: { kind: "expense" } },
];

/**
 * Expandable floating action button. Tap: expands into quick actions.
 * On the Debts tab the primary tap adds a ledger entry directly.
 */
export function Fab() {
  const pathname = usePathname();
  const openSheet = useUI((s) => s.openSheet);
  const sheetOpen = useUI((s) => s.sheet !== null);
  const [expanded, setExpanded] = useState(false);

  const visible = pathname !== "/settings";

  // Collapse when a sheet opens or the route changes
  useEffect(() => {
    setExpanded(false);
  }, [pathname, sheetOpen]);

  useEffect(() => {
    if (!expanded) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setExpanded(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [expanded]);

  const run = (sheet: NonNullable<ActiveSheet>) => {
    haptic();
    setExpanded(false);
    openSheet(sheet);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="fab-root"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ type: "spring", stiffness: 420, damping: 26 }}
          className="fixed bottom-[calc(76px+env(safe-area-inset-bottom))] right-5 z-30 flex flex-col items-end gap-2.5 lg:bottom-8 lg:right-8"
        >
          <AnimatePresence>
            {expanded && (
              <>
                {/* Scrim to catch outside taps */}
                <motion.button
                  key="fab-scrim"
                  aria-label="Close quick actions"
                  className="fixed inset-0 -z-10 cursor-default bg-black/25"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.18 }}
                  onClick={() => setExpanded(false)}
                />
                {ACTIONS.map((action, i) => (
                  <motion.button
                    key={action.label}
                    initial={{ opacity: 0, y: 14, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.85 }}
                    transition={{
                      type: "spring",
                      stiffness: 480,
                      damping: 30,
                      delay: (ACTIONS.length - 1 - i) * 0.035,
                    }}
                    whileTap={{ scale: 0.94 }}
                    onClick={() => run(action.sheet)}
                    className="flex cursor-pointer items-center gap-2.5 rounded-full bg-card py-2.5 pl-4 pr-5 text-[14px] font-semibold text-ink shadow-[0_6px_24px_rgba(0,0,0,0.3)] ring-1 ring-line"
                  >
                    <action.icon size={17} className="text-accent" />
                    {action.label}
                  </motion.button>
                ))}
              </>
            )}
          </AnimatePresence>

          <motion.button
            aria-label={expanded ? "Close quick actions" : "Quick actions"}
            aria-expanded={expanded}
            whileTap={{ scale: 0.9 }}
            whileHover={{ scale: 1.06 }}
            animate={{ rotate: expanded ? 45 : 0 }}
            transition={{ type: "spring", stiffness: 420, damping: 24 }}
            onClick={() => {
              haptic();
              setExpanded((v) => !v);
            }}
            className="flex h-[56px] w-[56px] cursor-pointer items-center justify-center rounded-full bg-accent text-white shadow-[0_6px_24px_rgba(0,0,0,0.35)]"
          >
            <PlusIcon size={26} strokeWidth={2.2} />
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
