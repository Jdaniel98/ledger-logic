import { useEffect } from 'react';

interface ShortcutActions {
  onQuickAdd: () => void;
  onCommandPalette: () => void;
  onNavigate: (view: string) => void;
}

const VIEW_MAP: Record<string, string> = {
  '1': 'dashboard',
  '2': 'transactions',
  '3': 'budget',
  '4': 'accounts',
  '5': 'settings',
};

export function useGlobalShortcuts({ onQuickAdd, onCommandPalette, onNavigate }: ShortcutActions) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isMeta = e.metaKey || e.ctrlKey;
      if (!isMeta) return;

      // ⌘+N — Quick add transaction
      if (e.key === 'n') {
        e.preventDefault();
        onQuickAdd();
        return;
      }

      // ⌘+K — Command palette
      if (e.key === 'k') {
        e.preventDefault();
        onCommandPalette();
        return;
      }

      // ⌘+1-5 — Navigate views
      const view = VIEW_MAP[e.key];
      if (view) {
        e.preventDefault();
        onNavigate(view);
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onQuickAdd, onCommandPalette, onNavigate]);
}
