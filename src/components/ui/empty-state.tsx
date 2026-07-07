"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  message: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, message, action }: EmptyStateProps) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 28 }}
      className="flex flex-col items-center px-8 pb-10 pt-14 text-center"
    >
      <div className="relative mb-6 flex h-24 w-24 items-center justify-center">
        {/* Concentric rings, radar-style */}
        <span className="absolute inset-0 rounded-full border border-line" aria-hidden="true" />
        <span className="absolute inset-3 rounded-full border border-line" aria-hidden="true" />
        <motion.div
          initial={reduceMotion ? false : { scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 320, damping: 20, delay: 0.08 }}
          className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-card-2 text-ink-2 shadow-[0_2px_12px_rgba(0,0,0,0.12)]"
        >
          {icon}
        </motion.div>
      </div>
      <h2 className="text-[17px] font-semibold text-ink">{title}</h2>
      <p className="mt-1.5 max-w-[260px] text-[14px] leading-relaxed text-ink-2">
        {message}
      </p>
      {action && <div className="mt-6">{action}</div>}
    </motion.div>
  );
}
