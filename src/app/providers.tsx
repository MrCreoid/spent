"use client";

import type { ReactNode } from "react";
import { AuthProvider } from "@/lib/auth-context";
import { DataProvider } from "@/lib/data-context";
import { ThemeSync } from "@/components/theme";
import { ServiceWorkerRegister } from "@/components/sw-register";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <DataProvider>
        <ThemeSync />
        <ServiceWorkerRegister />
        {children}
      </DataProvider>
    </AuthProvider>
  );
}
