# The Ledger

A local-first personal budgeting app for the desktop, built with Electron, React and TypeScript.
Your data stays in a SQLite database on your machine; nothing needs a server.

## Features

- **Accounts and transactions** across multiple currencies, including GHS, NGN, KES, ZAR, EGP,
  TZS, XOF and MAD alongside the majors
- **Budgets** by category, with rollover of unspent amounts into the next period
- **Recurring transactions** with reminders
- **Savings goals and debt tracking**, with progress notifications
- **Analytics**: spending over time and by category, drawn with D3
- **Receipts** attached to transactions
- **CSV export**, and a JSON backup you can write to and restore from any folder
- Light and dark themes, keyboard shortcuts

## Architecture

```
Renderer (React 19, Zustand stores, CSS Modules)
   │  typed IPC channels only (src/preload.ts, src/shared/types)
   ▼
Main process (Electron)
   ├─ Drizzle ORM → better-sqlite3 (WAL mode, foreign keys on)
   ├─ Exchange rates (fetched, then cached in the database)
   └─ Notifications, backups, CSV export
```

The renderer never touches Node or the database directly: every read and write goes through an
IPC channel defined in `src/shared/types/ipc-channels.ts`. The UI uses a small in-house component
library on Radix primitives, styled only through design tokens in `src/styles/tokens.css`;
components are documented in Storybook.

## Run it

Requires Node.js 20 or later.

```bash
git clone https://github.com/Jdaniel98/ledger-logic.git
cd ledger-logic
npm install
npm run dev          # Vite dev server + Electron
npm run storybook    # component library on http://localhost:6006
npm run make         # build installers with Electron Forge
```

The database lives at `~/Library/Application Support/The Ledger/ledger.db` on macOS.

## Known issues

These are the next things to fix, in order:

1. **Money is stored as floating-point numbers** (`REAL` columns). Amounts should be integer
   minor units (pesewas, kobo, cents) to avoid rounding errors in totals.
2. **Exchange rates for most African currencies are missing.** Rates come from the Frankfurter
   v1 API, which only covers the European Central Bank's ~30 currencies; of the African
   currencies above, only ZAR is among them. When a rate is missing the app falls back to 1.0,
   so a GHS amount is converted as if it were the same number of dollars. The fix is a source
   that covers these currencies (Frankfurter's v2 API draws on many more central banks; check its
   coverage first) and refusing to convert, rather than assuming 1.0, when no rate exists.
3. **No automated tests yet.** Vitest is configured; budget rollover and currency conversion
   are the first things to cover.

## License

MIT
