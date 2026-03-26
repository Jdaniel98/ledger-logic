import { useState } from 'react';
import { AppShell } from './layouts/AppShell/AppShell';
import { AccountsPage } from './pages/Accounts/AccountsPage';
import { Heading, Text } from './components';

function DashboardPlaceholder() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <Heading level={2} size="lg" weight="semibold">
        Dashboard Overview
      </Heading>
      <Text color="secondary">
        Dashboard will be built in Phase 1. Navigate to Accounts to test the IPC round-trip.
      </Text>
    </div>
  );
}

export function App() {
  const [activeView, setActiveView] = useState('dashboard');

  const renderView = () => {
    switch (activeView) {
      case 'accounts':
        return <AccountsPage />;
      case 'dashboard':
      default:
        return <DashboardPlaceholder />;
    }
  };

  return (
    <AppShell activeView={activeView} onNavigate={setActiveView}>
      {renderView()}
    </AppShell>
  );
}
