"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Pressable } from "@/components/ui/pressable";
import { ChevronLeftIcon, GoogleIcon, MailIcon } from "@/components/icons";
import { authErrorMessage, useAuth } from "@/lib/auth-context";

const inputClass =
  "w-full rounded-xl bg-card-2 px-4 py-3.5 text-[16px] text-ink placeholder:text-ink-3";

export default function SignInPage() {
  const router = useRouter();
  const { user, syncAvailable, signInWithGoogle, signInWithEmail, signUpWithEmail } =
    useAuth();

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState<"google" | "email" | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Already signed in → back to the app
  useEffect(() => {
    if (user) router.replace("/");
  }, [user, router]);

  const run = async (kind: "google" | "email", action: () => Promise<void>) => {
    setError(null);
    setBusy(kind);
    try {
      await action();
      router.replace("/");
    } catch (err) {
      setError(authErrorMessage(err));
      setBusy(null);
    }
  };

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col px-6 pt-safe pb-safe">
      <div className="pt-4">
        <Pressable
          aria-label="Back"
          onClick={() => router.back()}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-card text-ink-2"
        >
          <ChevronLeftIcon size={20} />
        </Pressable>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 320, damping: 32 }}
        className="flex flex-1 flex-col justify-center pb-24"
      >
        <h1 className="text-[32px] font-bold tracking-tight text-ink">
          {mode === "signin" ? "Welcome back" : "Create account"}
        </h1>
        <p className="mt-2 text-[15px] leading-relaxed text-ink-2">
          {mode === "signin"
            ? "Sign in and your expenses follow you to every device."
            : "One account keeps your data safe and in sync."}
        </p>

        {!syncAvailable && (
          <p className="mt-6 rounded-xl bg-card px-4 py-3 text-[14px] text-ink-2">
            Sync isn't configured in this build. Add your Firebase keys to{" "}
            <code className="text-ink">.env.local</code> and restart.
          </p>
        )}

        {error && (
          <p
            className="mt-6 rounded-xl bg-negative-soft px-4 py-3 text-[14px] font-medium text-negative"
            role="alert"
          >
            {error}
          </p>
        )}

        <div className="mt-8 flex flex-col gap-3">
          <Pressable
            disabled={!syncAvailable || busy !== null}
            onClick={() => void run("google", signInWithGoogle)}
            className="flex h-[52px] w-full items-center justify-center gap-2.5 rounded-2xl bg-card text-[16px] font-semibold text-ink disabled:opacity-40"
          >
            <GoogleIcon size={19} />
            {busy === "google" ? "Signing in…" : "Continue with Google"}
          </Pressable>

          <div className="my-2 flex items-center gap-3" aria-hidden="true">
            <div className="h-px flex-1 bg-line" />
            <span className="text-[12px] font-medium uppercase tracking-wide text-ink-3">
              or
            </span>
            <div className="h-px flex-1 bg-line" />
          </div>

          <form
            className="flex flex-col gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              void run("email", () =>
                mode === "signin"
                  ? signInWithEmail(email, password)
                  : signUpWithEmail(email, password)
              );
            }}
          >
            <input
              type="email"
              required
              autoComplete="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
              aria-label="Email"
            />
            <input
              type="password"
              required
              minLength={6}
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
              aria-label="Password"
            />
            <Pressable
              type="submit"
              disabled={!syncAvailable || busy !== null}
              className="flex h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-accent text-[16px] font-semibold text-white disabled:opacity-40"
            >
              <MailIcon size={18} />
              {busy === "email"
                ? "Please wait…"
                : mode === "signin"
                  ? "Sign in with email"
                  : "Sign up with email"}
            </Pressable>
          </form>

          <button
            onClick={() => {
              setMode((m) => (m === "signin" ? "signup" : "signin"));
              setError(null);
            }}
            className="mt-2 cursor-pointer py-2 text-center text-[14px] font-medium text-accent"
          >
            {mode === "signin"
              ? "New here? Create an account"
              : "Already have an account? Sign in"}
          </button>
        </div>
      </motion.div>
    </main>
  );
}
