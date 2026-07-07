"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  message: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, message, action }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 28 }}
      className="flex flex-col items-center px-8 pb-10 pt-16 text-center"
    >
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-card-2 text-ink-3">
        {icon}
      </div>
      <h2 className="text-[17px] font-semibold text-ink">{title}</h2>
      <p className="mt-1.5 max-w-[240px] text-[14px] leading-relaxed text-ink-2">
        {message}
      </p>
      {action && <div className="mt-6">{action}</div>}
    </motion.div>
  );
}
