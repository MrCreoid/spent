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
  { href: "/", label: "Expenses", icon: ListIcon },
  { href: "/analytics", label: "Analytics", icon: ChartIcon },
  { href: "/debts", label: "Debts", icon: DebtsIcon },
  { href: "/settings", label: "Settings", icon: SettingsIcon },
] as const;

export function TabBar() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-line backdrop-blur-xl"
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
  );
}
