import { useState, useCallback } from 'react';
import { AppShell } from './layouts/AppShell/AppShell';
import { DashboardPage } from './pages/Dashboard/DashboardPage';
import { AccountsPage } from './pages/Accounts/AccountsPage';
import { TransactionsPage } from './pages/Transactions/TransactionsPage';
import { CategoriesPage } from './pages/Categories/CategoriesPage';
import { BudgetPage } from './pages/Budget/BudgetPage';
import { RecurringPage } from './pages/Recurring/RecurringPage';
import { SettingsPage } from './pages/Settings/SettingsPage';
import { GoalsPage } from './pages/Goals/GoalsPage';
import { DebtsPage } from './pages/Debts/DebtsPage';
import { AnalyticsPage } from './pages/Analytics/AnalyticsPage';
import { TransactionFormDialog } from './pages/Transactions/TransactionFormDialog';
import { CommandPalette } from './components';
import { useTransactionsStore } from './stores/useTransactionsStore';
import { useGlobalShortcuts } from './hooks/useGlobalShortcuts';
import type { CreateTransactionData, UpdateTransactionData } from './shared/types/models';

export function App() {
  const [activeView, setActiveView] = useState('dashboard');
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const { createTransaction } = useTransactionsStore();

  const handleQuickAdd = useCallback(() => setQuickAddOpen(true), []);
  const handleCommandPalette = useCallback(() => setCommandPaletteOpen(true), []);

  useGlobalShortcuts({
    onQuickAdd: handleQuickAdd,
    onCommandPalette: handleCommandPalette,
    onNavigate: setActiveView,
  });

  const handleQuickAddSubmit = async (
    data: CreateTransactionData | { id: string; data: UpdateTransactionData },
  ) => {
    if ('id' in data) return; // Quick add is always a create
    await createTransaction(data);
    setQuickAddOpen(false);
  };

  const renderView = () => {
    switch (activeView) {
      case 'transactions':
        return <TransactionsPage />;
      case 'accounts':
        return <AccountsPage />;
      case 'budget':
        return <BudgetPage />;
      case 'categories':
        return <CategoriesPage />;
      case 'recurring':
        return <RecurringPage />;
      case 'goals':
        return <GoalsPage />;
      case 'debts':
        return <DebtsPage />;
      case 'analytics':
        return <AnalyticsPage />;
      case 'settings':
        return <SettingsPage />;
      case 'dashboard':
      default:
        return <DashboardPage />;
    }
  };

  return (
    <AppShell activeView={activeView} onNavigate={setActiveView} onQuickAdd={handleQuickAdd}>
      {renderView()}

      <TransactionFormDialog
        open={quickAddOpen}
        onOpenChange={setQuickAddOpen}
        onSubmit={handleQuickAddSubmit}
      />

      <CommandPalette
        open={commandPaletteOpen}
        onOpenChange={setCommandPaletteOpen}
        onNavigate={(view) => {
          setActiveView(view);
          setCommandPaletteOpen(false);
        }}
        onQuickAdd={handleQuickAdd}
      />
    </AppShell>
  );
}
