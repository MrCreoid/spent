"use client";

import { Pressable } from "@/components/ui/pressable";
import { BackspaceIcon } from "@/components/icons";
import { haptic } from "@/lib/haptics";

interface AmountPadProps {
  value: string;
  onChange: (next: string) => void;
}

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "⌫"] as const;

/** Phone-dialer style keypad — faster and steadier than the iOS keyboard */
export function AmountPad({ value, onChange }: AmountPadProps) {
  const press = (key: string) => {
    haptic(4);
    if (key === "⌫") {
      onChange(value.slice(0, -1));
      return;
    }
    if (key === ".") {
      if (value.includes(".")) return;
      onChange(value === "" ? "0." : value + ".");
      return;
    }
    // digit
    const [whole = "", frac] = value.split(".");
    if (frac !== undefined) {
      if (frac.length >= 2) return;
    } else if (whole.length >= 7) {
      return;
    }
    if (value === "0") {
      onChange(key);
      return;
    }
    onChange(value + key);
  };

  return (
    <div className="grid grid-cols-3 gap-1" role="group" aria-label="Amount keypad">
      {KEYS.map((key) => (
        <Pressable
          key={key}
          pressScale={0.92}
          aria-label={key === "⌫" ? "Delete" : key}
          onClick={() => press(key)}
          className="flex h-[52px] items-center justify-center rounded-2xl text-[22px] font-medium text-ink transition-colors duration-150 active:bg-press"
        >
          {key === "⌫" ? <BackspaceIcon size={24} className="text-ink-2" /> : key}
        </Pressable>
      ))}
    </div>
  );
}
