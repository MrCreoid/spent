"use client";

import { useEffect, useState } from "react";
import { Sheet } from "@/components/ui/sheet";
import { Pressable } from "@/components/ui/pressable";
import { CheckIcon } from "@/components/icons";
import { AVATAR_PALETTE, PersonAvatar } from "./avatar";
import { haptic } from "@/lib/haptics";
import { useData } from "@/lib/data-context";

interface PersonSheetProps {
  open: boolean;
  onClose: () => void;
}

/** Create a person in two taps: name, optional color, done. */
export function PersonSheet({ open, onClose }: PersonSheetProps) {
  const { addPerson, people } = useData();
  const [name, setName] = useState("");
  const [color, setColor] = useState<number | undefined>(undefined);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setName("");
      setColor(undefined);
      setSaving(false);
      setError(null);
    }
  }, [open]);

  const save = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Give them a name.");
      haptic([20, 40, 20]);
      return;
    }
    if (people.some((p) => p.key === trimmed.replace(/\s+/g, " ").toLowerCase())) {
      setError("This person already exists.");
      return;
    }
    setSaving(true);
    try {
      await addPerson(trimmed, color);
      haptic(10);
      onClose();
    } catch {
      setError("Couldn't save. Please try again.");
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onClose={onClose} ariaLabel="New person">
      <div className="flex flex-col gap-4 pb-4 pt-1">
        <h2 className="text-[15px] font-semibold text-ink-2">New person</h2>

        <div className="flex flex-col items-center gap-3 py-2">
          <PersonAvatar name={name || "?"} size={72} color={color} />
          <input
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") void save();
            }}
            placeholder="Name"
            autoComplete="off"
            maxLength={60}
            className="w-full max-w-[280px] rounded-xl bg-card-2 px-4 py-3 text-center text-[17px] font-medium text-ink placeholder:text-ink-3"
            aria-label="Person's name"
          />
          {error && (
            <p className="text-[13px] font-medium text-negative" role="alert">
              {error}
            </p>
          )}
        </div>

        <div>
          <p className="mb-2 px-1 text-[13px] font-semibold text-ink-2">
            Avatar color
          </p>
          <div
            className="flex justify-between gap-2"
            role="radiogroup"
            aria-label="Avatar color"
          >
            {AVATAR_PALETTE.map(([fg, bg], i) => (
              <Pressable
                key={fg}
                role="radio"
                aria-checked={color === i}
                aria-label={`Color ${i + 1}`}
                pressScale={0.88}
                onClick={() => {
                  haptic(4);
                  setColor(color === i ? undefined : i);
                }}
                className="flex h-11 w-11 items-center justify-center rounded-full transition-transform duration-150"
                style={{ background: bg, color: fg }}
              >
                {color === i && <CheckIcon size={18} strokeWidth={2.4} />}
              </Pressable>
            ))}
          </div>
        </div>

        <Pressable
          onClick={save}
          disabled={saving || !name.trim()}
          className="mt-1 h-[52px] w-full rounded-2xl bg-accent text-[17px] font-semibold text-white transition-opacity duration-200 disabled:opacity-35"
        >
          {saving ? "Saving…" : "Add person"}
        </Pressable>
      </div>
    </Sheet>
  );
}
