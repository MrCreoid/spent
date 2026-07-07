"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useMediaQuery } from "@/lib/use-media-query";

interface SheetProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  ariaLabel: string;
}

/**
 * Adaptive modal surface: an iOS-style bottom sheet on phones
 * (springs up, drags to dismiss), a centered dialog on desktop.
 */
export function Sheet({ open, onClose, children, ariaLabel }: SheetProps) {
  const reduceMotion = useReducedMotion();
  const desktop = useMediaQuery("(min-width: 640px)");

  // Lock body scroll while open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Escape to close
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (typeof document === "undefined") return null;

  const variants = reduceMotion
    ? {
        hidden: { opacity: 0 },
        visible: { opacity: 1 },
      }
    : desktop
      ? {
          hidden: { opacity: 0, scale: 0.96, y: 14 },
          visible: { opacity: 1, scale: 1, y: 0 },
        }
      : {
          hidden: { y: "100%" },
          visible: { y: 0 },
        };

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-40 flex items-end justify-center sm:items-center sm:p-6">
          <motion.div
            key="scrim"
            className="absolute inset-0 bg-black/45 sm:backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            key="sheet"
            role="dialog"
            aria-modal="true"
            aria-label={ariaLabel}
            className="relative z-10 flex max-h-[92dvh] w-full max-w-lg flex-col rounded-t-[1.75rem] bg-sheet shadow-[0_-8px_40px_rgba(0,0,0,0.35)] sm:max-h-[86dvh] sm:rounded-[1.75rem] sm:border sm:border-line sm:shadow-[0_24px_80px_rgba(0,0,0,0.45)]"
            variants={variants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={{ type: "spring", stiffness: 420, damping: 40 }}
            drag={reduceMotion || desktop ? false : "y"}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 110 || info.velocity.y > 600) onClose();
            }}
          >
            <div
              className="flex shrink-0 justify-center pb-1 pt-2.5 sm:hidden"
              aria-hidden="true"
            >
              <div className="h-[5px] w-9 rounded-full bg-ink-3/40" />
            </div>
            <div className="scroll-native min-h-0 flex-1 overflow-y-auto px-5 pb-safe sm:px-6 sm:pt-4">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
