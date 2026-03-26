import { useEffect } from 'react';
import { Wallet, Plus } from '@phosphor-icons/react';
import { Heading, Button, DataRow, Panel, Text } from '../../components';
import { useAccountsStore } from '../../stores/useAccountsStore';
import type { AccountType } from '../../shared/types/models';
import styles from './AccountsPage.module.css';

const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  checking: 'Checking',
  savings: 'Savings',
  credit: 'Credit Card',
  cash: 'Cash',
  investment: 'Investment',
};

export function AccountsPage() {
  const { accounts, isLoading, error, fetchAccounts, createAccount } =
    useAccountsStore();

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const handleAddAccount = () => {
    createAccount({
      name: `Account ${accounts.length + 1}`,
      type: 'checking',
      balance: 0,
    });
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <Heading level={2} size="lg">
          Accounts
        </Heading>
        <Button variant="primary" icon={<Plus size={16} weight="bold" />} onClick={handleAddAccount}>
          Add Account
        </Button>
      </div>

      {error && (
        <Text color="danger" size="sm">
          {error}
        </Text>
      )}

      {isLoading ? (
        <Text color="secondary">Loading accounts...</Text>
      ) : accounts.length === 0 ? (
        <Panel variant="default">
          <div className={styles.emptyState}>
            <Wallet size={48} weight="duotone" />
            <Heading level={3} size="md">
              No accounts yet
            </Heading>
            <Text color="secondary">
              Add your first account to start tracking your finances.
            </Text>
          </div>
        </Panel>
      ) : (
        <Panel variant="default" padding={false}>
          {accounts.map((account) => (
            <DataRow
              key={account.id}
              label={account.name}
              sublabel={ACCOUNT_TYPE_LABELS[account.type]}
              value={formatCurrency(account.balance, account.currency)}
              icon={<Wallet size={20} weight="duotone" />}
            />
          ))}
        </Panel>
      )}
    </div>
  );
}
