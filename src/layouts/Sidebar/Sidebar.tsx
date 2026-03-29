import { type ReactNode } from 'react';
import {
  House,
  ArrowsLeftRight,
  ChartPieSlice,
  Wallet,
  Tag,
  Repeat,
  Target,
  CreditCard,
  ChartBar,
  Gear,
  Plus,
} from '@phosphor-icons/react';
import styles from './Sidebar.module.css';

interface NavItem {
  id: string;
  label: string;
  icon: ReactNode;
  disabled?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <House size={18} /> },
  { id: 'transactions', label: 'Transactions', icon: <ArrowsLeftRight size={18} /> },
  { id: 'budget', label: 'Budget', icon: <ChartPieSlice size={18} /> },
  { id: 'accounts', label: 'Accounts', icon: <Wallet size={18} /> },
  { id: 'categories', label: 'Categories', icon: <Tag size={18} /> },
  { id: 'recurring', label: 'Recurring', icon: <Repeat size={18} /> },
  { id: 'goals', label: 'Goals', icon: <Target size={18} /> },
  { id: 'debts', label: 'Debts', icon: <CreditCard size={18} /> },
  { id: 'analytics', label: 'Analytics', icon: <ChartBar size={18} /> },
  { id: 'settings', label: 'Settings', icon: <Gear size={18} /> },
];

interface SidebarProps {
  activeView: string;
  onNavigate: (viewId: string) => void;
  onQuickAdd?: () => void;
}

export function Sidebar({ activeView, onNavigate, onQuickAdd }: SidebarProps) {
  return (
    <div className={styles.sidebar}>
      <div className={styles.header}>
        <div className={styles.brand}>
          <h1 className={styles.brandName}>The Ledger</h1>
          <span className={styles.brandTagline}>Financial Clarity</span>
        </div>
      </div>

      <nav className={styles.nav}>
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            className={styles.navItem}
            data-active={activeView === item.id || undefined}
            data-disabled={item.disabled || undefined}
            disabled={item.disabled}
            onClick={() => onNavigate(item.id)}
          >
            <span className={styles.navIcon}>{item.icon}</span>
            <span className={styles.navLabel}>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className={styles.footer}>
        <button className={styles.quickAddButton} onClick={onQuickAdd}>
          <Plus size={12} weight="bold" />
          <span>Quick Add</span>
        </button>
      </div>
    </div>
  );
}
