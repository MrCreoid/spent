"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import { forwardRef } from "react";

type PressableProps = HTMLMotionProps<"button"> & {
  /** Scale on press; subtle by default */
  pressScale?: number;
};

/** Button with native-feeling press feedback */
export const Pressable = forwardRef<HTMLButtonElement, PressableProps>(
  function Pressable({ pressScale = 0.97, style, ...props }, ref) {
    return (
      <motion.button
        ref={ref}
        whileTap={{ scale: pressScale }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        style={{ cursor: "pointer", touchAction: "manipulation", ...style }}
        {...props}
      />
    );
  }
);
