"use client";

import { motion } from "framer-motion";
import { useId } from "react";
import { haptic } from "@/lib/haptics";

interface SegmentedProps<T extends string> {
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel: string;
  className?: string;
}

/** iOS-style segmented control with a sliding thumb */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  className = "",
}: SegmentedProps<T>) {
  const id = useId();
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={`flex rounded-xl bg-card-2 p-1 ${className}`}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            role="tab"
            aria-selected={active}
            onClick={() => {
              if (!active) {
                haptic();
                onChange(opt.value);
              }
            }}
            className={`relative flex-1 cursor-pointer whitespace-nowrap rounded-[10px] px-3 py-1.5 text-[13px] font-semibold transition-colors duration-200 ${
              active ? "text-ink" : "text-ink-2"
            }`}
          >
            {active && (
              <motion.span
                layoutId={`segment-${id}`}
                className="absolute inset-0 rounded-[10px] bg-card shadow-[0_1px_4px_rgba(0,0,0,0.18)]"
                transition={{ type: "spring", stiffness: 500, damping: 38 }}
              />
            )}
            <span className="relative z-10">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
