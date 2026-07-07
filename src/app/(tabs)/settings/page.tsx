"use client";

import { useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { Segmented } from "@/components/ui/segmented";
import { Pressable } from "@/components/ui/pressable";
import { ConfirmSheet } from "@/components/ui/confirm-sheet";
import {
  AlertIcon,
  ChevronRightIcon,
  CloudIcon,
  CloudOffIcon,
  DownloadIcon,
  LogoutIcon,
  UploadIcon,
} from "@/components/icons";
import { CURRENCIES, currencySymbol } from "@/lib/currency";
import { useAuth } from "@/lib/auth-context";
import { useData } from "@/lib/data-context";
import { useSettings } from "@/lib/settings";
import { haptic } from "@/lib/haptics";
import type { Theme } from "@/lib/types";

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 px-2 text-[13px] font-semibold uppercase tracking-wide text-ink-2">
        {title}
      </h2>
      <div className="overflow-hidden card-surface">{children}</div>
    </section>
  );
}

function Row({
  label,
  sub,
  control,
  danger,
  onClick,
}: {
  label: string;
  sub?: string;
  control?: ReactNode;
  danger?: boolean;
  onClick?: () => void;
}) {
  const inner = (
    <>
      <div className="min-w-0 flex-1 text-left">
        <p
          className={`text-[15px] font-medium ${danger ? "text-negative" : "text-ink"}`}
        >
          {label}
        </p>
        {sub && <p className="mt-0.5 truncate text-[13px] text-ink-3">{sub}</p>}
      </div>
      {control}
    </>
  );
  if (onClick) {
    return (
      <Pressable
        onClick={onClick}
        pressScale={0.99}
        className="flex w-full items-center gap-3 px-4 py-3.5 transition-colors duration-150 hover:bg-press active:bg-press"
      >
        {inner}
      </Pressable>
    );
  }
  return <div className="flex items-center gap-3 px-4 py-3.5">{inner}</div>;
}

const Divider = () => <div className="ml-4 h-px bg-line" />;

export default function SettingsPage() {
  const { theme, setTheme, currency, setCurrency } = useSettings();
  const { user, syncAvailable, signOut } = useAuth();
  const { exportData, importData, resetAll } = useData();

  const fileRef = useRef<HTMLInputElement>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const flash = (text: string) => {
    setMessage(text);
    window.setTimeout(() => setMessage(null), 3000);
  };

  const handleExport = () => {
    const data = exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `spent-backup-${data.exportedAt.slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    haptic(10);
    flash("Backup downloaded.");
  };

  const handleImportFile = async (file: File) => {
    try {
      const parsed = JSON.parse(await file.text());
      const { expenses, entries } = await importData(parsed);
      haptic(10);
      flash(`Restored ${expenses} expenses and ${entries} ledger entries.`);
    } catch (err) {
      flash(err instanceof Error ? err.message : "That file couldn't be read.");
    }
  };

  return (
    <div className="pt-6 lg:max-w-2xl">
      <header className="px-1">
        <h1 className="text-[28px] font-bold tracking-tight text-ink">Settings</h1>
      </header>

      {message && (
        <p
          className="mt-4 rounded-xl bg-accent-soft px-4 py-3 text-[14px] font-medium text-accent"
          role="status"
        >
          {message}
        </p>
      )}

      <div className="mt-5 flex flex-col gap-6">
        <Group title="Sync">
          {!syncAvailable ? (
            <Row
              label="Sync not configured"
              sub="Add Firebase keys to .env.local to sync across devices."
              control={<CloudOffIcon size={20} className="text-ink-3" />}
            />
          ) : user ? (
            <>
              <Row
                label={user.displayName || "Signed in"}
                sub={`${user.email ?? ""} · Syncing across devices`}
                control={<CloudIcon size={20} className="text-accent" />}
              />
              <Divider />
              <Row
                label="Sign out"
                danger
                control={<LogoutIcon size={18} className="text-negative" />}
                onClick={() => void signOut()}
              />
            </>
          ) : (
            <Link href="/sign-in" className="block">
              <Row
                label="Sign in to sync"
                sub="Back up your data and use it on every device."
                control={<ChevronRightIcon size={18} className="text-ink-3" />}
              />
            </Link>
          )}
        </Group>

        <Group title="Appearance">
          <div className="px-4 py-3.5">
            <Segmented
              ariaLabel="Theme"
              options={[
                { value: "light", label: "Light" },
                { value: "dark", label: "Dark" },
                { value: "system", label: "System" },
              ]}
              value={theme}
              onChange={(v) => setTheme(v as Theme)}
            />
          </div>
        </Group>

        <Group title="Currency">
          <div className="flex items-center gap-3 px-4 py-3.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-card-2 text-[15px] font-semibold text-ink">
              {currencySymbol(currency)}
            </span>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              aria-label="Currency"
              className="min-w-0 flex-1 cursor-pointer appearance-none bg-transparent text-[15px] font-medium text-ink"
            >
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.label} ({c.code})
                </option>
              ))}
            </select>
            <ChevronRightIcon size={16} className="rotate-90 text-ink-3" />
          </div>
        </Group>

        <Group title="Data">
          <Row
            label="Export backup"
            sub="Download everything as a JSON file."
            control={<DownloadIcon size={18} className="text-ink-3" />}
            onClick={handleExport}
          />
          <Divider />
          <Row
            label="Import backup"
            sub="Restore from a previously exported file."
            control={<UploadIcon size={18} className="text-ink-3" />}
            onClick={() => fileRef.current?.click()}
          />
          <Divider />
          <Row
            label="Erase all data"
            sub="Delete every expense and debt."
            danger
            control={<AlertIcon size={18} className="text-negative" />}
            onClick={() => setConfirmReset(true)}
          />
        </Group>

        <p className="pb-2 text-center text-[12px] text-ink-3">
          Spent · Local-first, synced with Firebase
        </p>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="application/json"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleImportFile(file);
          e.target.value = "";
        }}
      />

      <ConfirmSheet
        open={confirmReset}
        title="Erase all data?"
        message={
          user
            ? "Every expense and debt in your account will be permanently deleted from this device and the cloud."
            : "Every expense and debt on this device will be permanently deleted."
        }
        confirmLabel="Erase everything"
        onConfirm={() => {
          setConfirmReset(false);
          void resetAll().then(() => flash("All data erased."));
        }}
        onCancel={() => setConfirmReset(false)}
      />
    </div>
  );
}
