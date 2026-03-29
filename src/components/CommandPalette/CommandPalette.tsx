import { useState, useEffect, useRef, useCallback, type ReactNode } from 'react';
import {
  MagnifyingGlass,
  House,
  ArrowsLeftRight,
  ChartPieSlice,
  Wallet,
  Gear,
  Plus,
  Tag,
  Repeat,
  Target,
  CreditCard,
  ChartBar,
} from '@phosphor-icons/react';
import styles from './CommandPalette.module.css';

interface Command {
  id: string;
  label: string;
  icon: ReactNode;
  group: string;
  shortcut?: string;
  action: () => void;
}

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNavigate: (view: string) => void;
  onQuickAdd: () => void;
}

export function CommandPalette({ open, onOpenChange, onNavigate, onQuickAdd }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const commands: Command[] = [
    { id: 'nav-dashboard', label: 'Go to Dashboard', icon: <House size={16} />, group: 'Navigation', shortcut: '\u2318 1', action: () => onNavigate('dashboard') },
    { id: 'nav-transactions', label: 'Go to Transactions', icon: <ArrowsLeftRight size={16} />, group: 'Navigation', shortcut: '\u2318 2', action: () => onNavigate('transactions') },
    { id: 'nav-budget', label: 'Go to Budget', icon: <ChartPieSlice size={16} />, group: 'Navigation', shortcut: '\u2318 3', action: () => onNavigate('budget') },
    { id: 'nav-accounts', label: 'Go to Accounts', icon: <Wallet size={16} />, group: 'Navigation', shortcut: '\u2318 4', action: () => onNavigate('accounts') },
    { id: 'nav-categories', label: 'Go to Categories', icon: <Tag size={16} />, group: 'Navigation', action: () => onNavigate('categories') },
    { id: 'nav-recurring', label: 'Go to Recurring', icon: <Repeat size={16} />, group: 'Navigation', action: () => onNavigate('recurring') },
    { id: 'nav-goals', label: 'Go to Goals', icon: <Target size={16} />, group: 'Navigation', action: () => onNavigate('goals') },
    { id: 'nav-debts', label: 'Go to Debts', icon: <CreditCard size={16} />, group: 'Navigation', action: () => onNavigate('debts') },
    { id: 'nav-analytics', label: 'Go to Analytics', icon: <ChartBar size={16} />, group: 'Navigation', action: () => onNavigate('analytics') },
    { id: 'nav-settings', label: 'Go to Settings', icon: <Gear size={16} />, group: 'Navigation', shortcut: '\u2318 5', action: () => onNavigate('settings') },
    { id: 'action-add-tx', label: 'Add Transaction', icon: <Plus size={16} />, group: 'Actions', shortcut: '\u2318 N', action: () => onQuickAdd() },
  ];

  const filtered = query.trim()
    ? commands.filter((c) => c.label.toLowerCase().includes(query.toLowerCase()))
    : commands;

  const grouped = filtered.reduce<Record<string, Command[]>>((acc, cmd) => {
    (acc[cmd.group] ??= []).push(cmd);
    return acc;
  }, {});

  const execute = useCallback(
    (cmd: Command) => {
      onOpenChange(false);
      cmd.action();
    },
    [onOpenChange],
  );

  useEffect(() => {
    if (open) {
      setQuery('');
      setActiveIndex(0);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  useEffect(() => {
    if (!open) return;

    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onOpenChange(false);
        return;
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
        return;
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
        return;
      }

      if (e.key === 'Enter' && filtered[activeIndex]) {
        e.preventDefault();
        execute(filtered[activeIndex]);
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, filtered, activeIndex, execute, onOpenChange]);

  if (!open) return null;

  return (
    <div className={styles.overlay} onClick={() => onOpenChange(false)}>
      <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
        <div className={styles.searchWrapper}>
          <MagnifyingGlass size={18} className={styles.searchIcon} />
          <input
            ref={inputRef}
            className={styles.searchInput}
            placeholder="Type a command..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className={styles.results}>
          {filtered.length === 0 ? (
            <div className={styles.empty}>No matching commands</div>
          ) : (
            Object.entries(grouped).map(([group, cmds]) => (
              <div key={group}>
                <div className={styles.groupLabel}>{group}</div>
                {cmds.map((cmd) => {
                  const flatIndex = filtered.indexOf(cmd);
                  return (
                    <button
                      key={cmd.id}
                      className={styles.item}
                      data-active={flatIndex === activeIndex}
                      onClick={() => execute(cmd)}
                      onMouseEnter={() => setActiveIndex(flatIndex)}
                    >
                      <span className={styles.itemIcon}>{cmd.icon}</span>
                      <span className={styles.itemLabel}>{cmd.label}</span>
                      {cmd.shortcut && <span className={styles.shortcut}>{cmd.shortcut}</span>}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
