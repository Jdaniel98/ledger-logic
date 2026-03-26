# Ledger Logic (The Ledger) — Project Instructions

## Project
Personal budget planner — Electron macOS desktop app.
Renderer: React 19 + TypeScript + CSS Modules + CSS custom properties.
Main process: Node.js + better-sqlite3 + Drizzle ORM.
Local-first, offline-capable. No server dependency for core functionality.

## Design System Rules (NON-NEGOTIABLE)
- ALL colors must reference CSS custom properties from `src/styles/tokens.css`
- ALL spacing must use the spacing scale from tokens.css (`--space-*`)
- ALL typography must use font tokens from tokens.css (`--font-*`)
- ALL border radii must use radius tokens from tokens.css (`--radius-*`)
- ALL shadows must use shadow tokens from tokens.css (`--shadow-*`)
- NEVER use raw hex/rgb/hsl color values in component files
- NEVER use inline styles with raw values
- NEVER import @shadcn, @chakra-ui, @mui, or any styled component library
- NEVER use Tailwind utility classes in production components
- Use Phosphor Icons (`@phosphor-icons/react`) — duotone for categories, regular for navigation
- Use Radix Primitives for complex interactions (dialogs, popovers, dropdowns) — style from scratch

## Typography
- Primary font: Inter (Regular 400, Medium 500, SemiBold 600, Bold 700)
- Sidebar/nav font: Nimbus Sans (Regular 400, Bold 700)
- Font files self-hosted in `src/assets/fonts/` — no CDN
- Size scale: 10px, 12px, 14px, 16px, 18px, 30px (via `--font-size-*` tokens)
- Tabular numbers (`font-variant-numeric: tabular-nums`) for all financial amounts

## Color Palette (from Figma)
- Accent: `#005bc1` (primary blue), `#004faa` (dark), `#1e40af` (active nav)
- Text: `#2d3338` (primary), `#596065` (secondary), `#475569` (nav)
- Danger: `#9f403d` (overspend, expenses)
- Backgrounds: `#f9f9fb` (main), `#f2f4f6` (card), `#ebeef2` (chart), `#e4e9ee` (panel)
- Dark mode defined via `[data-theme="dark"]` selectors in tokens.css

## Spacing Scale
4px (`--space-1`), 8px (`--space-2`), 12px (`--space-3`), 16px (`--space-4`), 24px (`--space-6`), 32px (`--space-8`), 40px (`--space-10`)

## Component Patterns
- All UI components live in `src/components/` as `ComponentName/ComponentName.tsx` + `.module.css`
- Reuse existing components before creating new ones
- Components must work in both `[data-theme="light"]` and `[data-theme="dark"]`
- Use `forwardRef` for all components that render DOM elements
- Use `data-variant` attributes for variant-based styling in CSS Modules
- Animations: CSS transitions only, 120–200ms, ease-out `cubic-bezier(0.16, 1, 0.3, 1)`
- No spring/bounce animations — this is a finance tool

## Architecture
- Renderer NEVER imports Node.js modules directly
- All data access goes through IPC channels defined in `src/preload.ts`
- IPC channel names defined in `src/shared/types/ipc-channels.ts`
- Domain types shared via `src/shared/types/models.ts`
- SQLite queries via Drizzle ORM in `src/main/database/`
- Zustand stores in `src/stores/` — one store per domain entity
- Pages in `src/pages/PageName/PageNamePage.tsx`

## Database
- SQLite via better-sqlite3 (main process only)
- Location: `~/Library/Application Support/The Ledger/ledger.db`
- WAL mode enabled, foreign keys enforced
- All IDs are client-generated UUIDs (TEXT)
- Timestamps are Unix milliseconds (INTEGER)
- Schema defined in `src/main/database/schema.ts` (Drizzle ORM)

## Commands
- `npm run start` — Run in development
- `npm run make` — Build distributable
- `npm run storybook` — Component library
- `npx drizzle-kit generate` — Generate migration from schema changes

## File Conventions
- Components: `src/components/ComponentName/ComponentName.tsx` + `.module.css`
- Stories: `src/components/ComponentName/ComponentName.stories.tsx`
- Stores: `src/stores/use[Name]Store.ts`
- IPC handlers: `src/main/ipc/[domain].handler.ts`
- Pages: `src/pages/[Name]/[Name]Page.tsx`
- Layout components: `src/layouts/[Name]/[Name].tsx`
- Shared types: `src/shared/types/`
- Styles: `src/styles/` (tokens.css, fonts.css, global.css, reset.css)

## What This App Must NEVER Look Like
- White cards with light gray backgrounds and blue/purple buttons (generic SaaS look)
- Uniform border-radius on every element
- Gradient backgrounds (purple→blue, pink→orange)
- Charts with default Chart.js/Recharts styling
- Animations that overshoot, spring, or bounce
- Empty states that say "No data yet" with a sad emoji
