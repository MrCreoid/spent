"use client";

import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { PlusIcon } from "@/components/icons";
import { useUI } from "@/lib/ui-store";
import { haptic } from "@/lib/haptics";

/**
 * Thumb-reach floating action button. Adds an expense everywhere,
 * a ledger entry when the Debts tab is active. Hidden on Settings.
 */
export function Fab() {
  const pathname = usePathname();
  const openSheet = useUI((s) => s.openSheet);

  const isDebts = pathname === "/debts";
  const visible = pathname !== "/settings";

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          key="fab"
          aria-label={isDebts ? "Add ledger entry" : "Add expense"}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          whileTap={{ scale: 0.9 }}
          whileHover={{ scale: 1.06 }}
          transition={{ type: "spring", stiffness: 420, damping: 26 }}
          onClick={() => {
            haptic();
            openSheet(isDebts ? { kind: "entry" } : { kind: "expense" });
          }}
          className="fixed bottom-[calc(76px+env(safe-area-inset-bottom))] right-5 z-30 flex h-[56px] w-[56px] cursor-pointer items-center justify-center rounded-full bg-accent text-white shadow-[0_6px_24px_rgba(0,0,0,0.35)] lg:bottom-8 lg:right-8"
        >
          <PlusIcon size={26} strokeWidth={2.2} />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
