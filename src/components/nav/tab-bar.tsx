"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  ChartIcon,
  DebtsIcon,
  ListIcon,
  SettingsIcon,
} from "@/components/icons";
import { haptic } from "@/lib/haptics";

const TABS = [
  { href: "/", label: "Expenses", icon: ListIcon, key: "1" },
  { href: "/analytics", label: "Analytics", icon: ChartIcon, key: "2" },
  { href: "/debts", label: "Debts", icon: DebtsIcon, key: "3" },
  { href: "/settings", label: "Settings", icon: SettingsIcon, key: "4" },
] as const;

/** Bottom tab bar on phones, left rail on desktop */
export function TabBar() {
  const pathname = usePathname();

  return (
    <>
      {/* Phone: bottom tabs */}
      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-line backdrop-blur-xl lg:hidden"
        style={{ background: "var(--tabbar)" }}
      >
        <div className="mx-auto flex max-w-lg items-stretch pb-safe">
          {TABS.map(({ href, label, icon: TabIcon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                onClick={() => haptic(5)}
                className={`relative flex min-h-[52px] flex-1 flex-col items-center justify-center gap-0.5 pt-1.5 transition-colors duration-200 ${
                  active ? "text-accent" : "text-ink-3"
                }`}
              >
                <motion.span
                  whileTap={{ scale: 0.88 }}
                  transition={{ type: "spring", stiffness: 500, damping: 28 }}
                  className="flex flex-col items-center gap-0.5"
                >
                  <TabIcon size={24} strokeWidth={active ? 2.1 : 1.8} />
                  <span className="text-[10px] font-medium leading-tight">
                    {label}
                  </span>
                </motion.span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Desktop: left rail */}
      <nav
        aria-label="Main"
        className="fixed inset-y-0 left-0 z-30 hidden w-[224px] flex-col border-r border-line bg-card/40 px-3 py-6 backdrop-blur-xl lg:flex"
      >
        <div className="flex items-center gap-2.5 px-3 pb-7">
          <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-ink text-bg">
            <ChartIcon size={16} strokeWidth={2.2} />
          </span>
          <span className="text-[16px] font-bold tracking-tight text-ink">
            Spent
          </span>
        </div>
        <div className="flex flex-col gap-1">
          {TABS.map(({ href, label, icon: TabIcon, key }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-medium transition-colors duration-150 ${
                  active
                    ? "text-ink"
                    : "text-ink-2 hover:bg-press hover:text-ink"
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="rail-active"
                    className="absolute inset-0 rounded-xl bg-card-2"
                    transition={{ type: "spring", stiffness: 480, damping: 40 }}
                  />
                )}
                <TabIcon
                  size={19}
                  strokeWidth={active ? 2.1 : 1.8}
                  className={`relative z-10 ${active ? "text-accent" : ""}`}
                />
                <span className="relative z-10 flex-1">{label}</span>
                <kbd className="relative z-10 rounded-md bg-press px-1.5 py-0.5 text-[10.5px] font-semibold text-ink-3">
                  {key}
                </kbd>
              </Link>
            );
          })}
        </div>
        <div className="mt-auto px-3 text-[11.5px] leading-relaxed text-ink-3">
          <p>
            <kbd className="rounded-md bg-press px-1.5 py-0.5 font-semibold">N</kbd>{" "}
            new expense
          </p>
          <p className="mt-1.5">
            <kbd className="rounded-md bg-press px-1.5 py-0.5 font-semibold">D</kbd>{" "}
            new debt entry
          </p>
        </div>
      </nav>
    </>
  );
}
