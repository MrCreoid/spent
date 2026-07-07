"use client";

import { animate, motion, useMotionValue } from "framer-motion";
import { useRef, type ReactNode } from "react";
import { PencilIcon, TrashIcon, CheckIcon } from "@/components/icons";
import { haptic } from "@/lib/haptics";

interface SwipeAction {
  label: string;
  icon: "edit" | "delete" | "settle";
  onAction: () => void;
}

interface SwipeRowProps {
  children: ReactNode;
  actions: SwipeAction[];
  onTap?: () => void;
}

const ACTION_WIDTH = 72;

const ICONS = {
  edit: PencilIcon,
  delete: TrashIcon,
  settle: CheckIcon,
};

const ACTION_STYLE: Record<SwipeAction["icon"], string> = {
  edit: "bg-card-2 text-ink-2",
  delete: "bg-negative text-white",
  settle: "bg-positive text-white",
};

/**
 * iOS-style swipe-to-reveal actions. Swipe left to expose buttons,
 * tap the row (or swipe back) to close, tap through when closed.
 */
export function SwipeRow({ children, actions, onTap }: SwipeRowProps) {
  const x = useMotionValue(0);
  const open = useRef(false);
  const dragged = useRef(false);
  const width = actions.length * ACTION_WIDTH;

  const settle = (target: number) => {
    animate(x, target, { type: "spring", stiffness: 480, damping: 42 });
    const wasOpen = open.current;
    open.current = target !== 0;
    if (open.current !== wasOpen) haptic(5);
  };

  return (
    <div className="relative overflow-hidden">
      {/* Revealed actions */}
      <div
        className="absolute inset-y-0 right-0 flex items-stretch"
        style={{ width }}
        aria-hidden={!open.current}
      >
        {actions.map((action) => {
          const ActionIcon = ICONS[action.icon];
          return (
            <button
              key={action.label}
              aria-label={action.label}
              tabIndex={-1}
              onClick={() => {
                settle(0);
                action.onAction();
              }}
              className={`flex flex-1 cursor-pointer flex-col items-center justify-center gap-1 text-[11px] font-medium ${ACTION_STYLE[action.icon]}`}
            >
              <ActionIcon size={20} />
              {action.label}
            </button>
          );
        })}
      </div>

      <motion.div
        style={{ x }}
        drag="x"
        dragConstraints={{ left: -width, right: 0 }}
        dragElastic={{ left: 0.08, right: 0.08 }}
        dragMomentum={false}
        onDragStart={() => {
          dragged.current = true;
        }}
        onDragEnd={(_, info) => {
          const shouldOpen =
            info.offset.x < -width / 2 || info.velocity.x < -400;
          settle(shouldOpen ? -width : 0);
          // Let the click handler know this gesture was a drag
          requestAnimationFrame(() => {
            dragged.current = false;
          });
        }}
        onClick={() => {
          if (dragged.current) return;
          if (open.current) {
            settle(0);
          } else {
            onTap?.();
          }
        }}
        className="relative bg-card"
      >
        {children}
      </motion.div>
    </div>
  );
}
