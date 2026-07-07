# Spent

A fast, minimal expense & debt tracker that feels like a native iOS app. Local-first, installable as a PWA, and synced across devices with Firebase when you sign in.

> Open app → add expense in under 5 seconds → close app.

## Features

- **Expenses** — amount keypad, 9 categories, automatic time, optional note, edit/delete with swipe gestures
- **Analytics** — monthly & yearly totals, daily trend, monthly trend, last-7-days, category breakdown, largest expense, average per day
- **Debts** — who owes you / who you owe, due dates with overdue highlighting, settle/reopen, search & filters
- **Local-first** — works fully offline as a guest (IndexedDB); sign in to sync everywhere
- **PWA** — install to the iPhone Home Screen for a full-screen, native-feeling app
- **Dark / Light / System** themes, multi-currency, JSON export/import backup

## Stack

Next.js 15 · React 19 · TypeScript · Tailwind CSS v4 · Framer Motion · React Hook Form + Zod · Zustand · Dexie (IndexedDB) · Firebase (Auth + Firestore offline persistence) · Recharts

## Getting started

```bash
npm install
npm run dev
```

The app runs fully **without any configuration** in local-only guest mode.

## Enabling sync (Firebase)

1. Create a project at [console.firebase.google.com](https://console.firebase.google.com).
2. **Authentication → Sign-in method**: enable **Google** and **Email/Password**.
3. **Firestore Database**: create a database (production mode).
4. **Project settings → Your apps → Web**: register a web app and copy the config.
5. Copy `.env.local.example` to `.env.local` and paste the values.
6. Restart the dev server. Sign in from **Settings → Sign in to sync**.

Deploy the security rules (data is fully isolated per user):

```bash
npm install -g firebase-tools
firebase login
firebase use <your-project-id>
firebase deploy --only firestore:rules,storage
```

Any guest data on the device is automatically migrated into your account the first time you sign in. Offline edits sync automatically when the connection returns (Firestore persistent cache).

## PWA install (iPhone)

Serve over HTTPS (or localhost), open in Safari → Share → **Add to Home Screen**. The app launches full-screen with its own icon and splash screen.

Icons and splash screens are generated from code — tweak the mark in `scripts/generate-icons.mjs` and re-run `npm run icons`.

## Project structure

```
src/
  app/            # Routes: (tabs)/{expenses,analytics,debts,settings}, sign-in
  components/     # Reusable UI (sheet, segmented, swipe-row, tab bar, icons…)
  features/       # Feature modules: expenses, debts, analytics
  lib/            # Types, stores, data layer
    repo/         # DataRepo interface + Local (Dexie) & Cloud (Firestore) impls
firestore.rules   # Per-user data isolation
storage.rules     # Receipt images (future), user-scoped
```

## Data model

- `users/{uid}/expenses/{id}` — amount, category, date, time, note
- `users/{uid}/debts/{id}` — person, amount, type (lent/borrowed), reason, date, dueDate, status

Guest mode mirrors the same shapes in IndexedDB (`spent` database). Backups are plain JSON and portable between modes.
