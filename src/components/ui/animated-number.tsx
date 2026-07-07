"use client";

import { useEffect, useRef, useState } from "react";
import { animate, useReducedMotion } from "framer-motion";
import { formatMoney } from "@/lib/currency";

interface AnimatedMoneyProps {
  value: number;
  currency: string;
  className?: string;
}

/** Money value that counts smoothly to its new amount */
export function AnimatedMoney({ value, currency, className }: AnimatedMoneyProps) {
  const reduceMotion = useReducedMotion();
  const [display, setDisplay] = useState(value);
  const prev = useRef(value);

  useEffect(() => {
    if (reduceMotion || prev.current === value) {
      prev.current = value;
      setDisplay(value);
      return;
    }
    const controls = animate(prev.current, value, {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setDisplay(v),
    });
    prev.current = value;
    return () => controls.stop();
  }, [value, reduceMotion]);

  // Round mid-animation values so we never show fake precision
  const rounded = Number.isInteger(value) ? Math.round(display) : display;

  return (
    <span className={`tnum ${className ?? ""}`}>
      {formatMoney(rounded, currency)}
    </span>
  );
}
