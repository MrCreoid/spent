"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import { forwardRef } from "react";

type PressableProps = HTMLMotionProps<"button"> & {
  /** Scale on press; subtle by default */
  pressScale?: number;
};

/**
 * Button with native-feeling press feedback.
 * Defaults to type="button" so a Pressable inside a form never
 * submits it by accident — pass type="submit" explicitly when needed.
 */
export const Pressable = forwardRef<HTMLButtonElement, PressableProps>(
  function Pressable({ pressScale = 0.97, style, type, ...props }, ref) {
    return (
      <motion.button
        ref={ref}
        type={type ?? "button"}
        whileTap={{ scale: pressScale }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        style={{ cursor: "pointer", touchAction: "manipulation", ...style }}
        {...props}
      />
    );
  }
);
