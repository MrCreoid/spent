"use client";

import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { PlusIcon } from "@/components/icons";
import { useUI } from "@/lib/ui-store";
import { haptic } from "@/lib/haptics";

/**
 * Thumb-reach floating action button. Adds an expense everywhere,
 * a debt when the Debts tab is active. Hidden on Settings.
 */
export function Fab() {
  const pathname = usePathname();
  const openSheet = useUI((s) => s.openSheet);

  const kind = pathname === "/debts" ? "debt" : "expense";
  const visible = pathname !== "/settings";

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          key="fab"
          aria-label={kind === "debt" ? "Add debt" : "Add expense"}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          whileTap={{ scale: 0.9 }}
          transition={{ type: "spring", stiffness: 420, damping: 26 }}
          onClick={() => {
            haptic();
            openSheet({ kind });
          }}
          className="fixed bottom-[calc(76px+env(safe-area-inset-bottom))] right-5 z-30 flex h-[56px] w-[56px] cursor-pointer items-center justify-center rounded-full bg-accent text-white shadow-[0_6px_24px_rgba(0,0,0,0.35)]"
        >
          <PlusIcon size={26} strokeWidth={2.2} />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
