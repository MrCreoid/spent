"use client";

import { Sheet } from "./sheet";
import { Pressable } from "./pressable";
import { haptic } from "@/lib/haptics";

interface ConfirmSheetProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Action-sheet style confirmation for destructive operations */
export function ConfirmSheet({
  open,
  title,
  message,
  confirmLabel,
  destructive = true,
  onConfirm,
  onCancel,
}: ConfirmSheetProps) {
  return (
    <Sheet open={open} onClose={onCancel} ariaLabel={title}>
      <div className="pb-4 pt-2">
        <h2 className="text-[17px] font-semibold text-ink">{title}</h2>
        <p className="mt-1.5 text-[14px] leading-relaxed text-ink-2">{message}</p>
        <div className="mt-6 flex flex-col gap-2.5">
          <Pressable
            onClick={() => {
              haptic([10, 30, 10]);
              onConfirm();
            }}
            className={`h-[50px] w-full rounded-2xl text-[16px] font-semibold text-white ${
              destructive ? "bg-negative" : "bg-accent"
            }`}
          >
            {confirmLabel}
          </Pressable>
          <Pressable
            onClick={onCancel}
            className="h-[50px] w-full rounded-2xl bg-card-2 text-[16px] font-semibold text-ink"
          >
            Cancel
          </Pressable>
        </div>
      </div>
    </Sheet>
  );
}
