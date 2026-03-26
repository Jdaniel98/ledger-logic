import { useEffect, useState, type ReactNode } from 'react';
import {
  Bank,
  PiggyBank,
  CreditCard,
  Money,
  ChartLineUp,
  Plus,
  PencilSimple,
  Trash,
} from '@phosphor-icons/react';
import { Heading, Button, Panel, Text, CurrencyDisplay, EmptyState, Skeleton } from '../../components';
import { useAccountsStore } from '../../stores/useAccountsStore';
import { AccountFormDialog } from './AccountFormDialog';
import type { Account, AccountType } from '../../shared/types/models';
import styles from './AccountsPage.module.css';

const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  checking: 'Checking',
  savings: 'Savings',
  credit: 'Credit Card',
  cash: 'Cash',
  investment: 'Investment',
};

const ACCOUNT_TYPE_ICONS: Record<AccountType, ReactNode> = {
  checking: <Bank size={20} weight="duotone" />,
  savings: <PiggyBank size={20} weight="duotone" />,
  credit: <CreditCard size={20} weight="duotone" />,
  cash: <Money size={20} weight="duotone" />,
  investment: <ChartLineUp size={20} weight="duotone" />,
};

export function AccountsPage() {
  const { accounts, isLoading, fetchAccounts, deleteAccount } = useAccountsStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Account | null>(null);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const handleAdd = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const handleEdit = (account: Account) => {
    setEditing(account);
    setDialogOpen(true);
  };

  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <Heading level={2} size="lg" weight="semibold">Accounts</Heading>
        <Button variant="primary" icon={<Plus size={16} weight="bold" />} onClick={handleAdd}>
          Add Account
        </Button>
      </div>

      {isLoading ? (
        <div className={styles.skeletons}>
          <Skeleton variant="card" />
          <Skeleton variant="card" />
        </div>
      ) : accounts.length === 0 ? (
        <EmptyState
          icon={<Bank size={56} weight="duotone" />}
          heading="No accounts yet"
          description="Add your first account to start tracking your finances."
          action={
            <Button variant="primary" icon={<Plus weight="bold" />} onClick={handleAdd}>
              Add Account
            </Button>
          }
        />
      ) : (
        <>
          <Panel>
            <div className={styles.totalRow}>
              <Text size="sm" color="secondary">Total Balance</Text>
              <CurrencyDisplay amount={totalBalance} size="lg" weight="bold" />
            </div>
          </Panel>

          <Panel padding={false}>
            {accounts.map((account) => (
              <div key={account.id} className={styles.accountRow}>
                <div className={styles.accountIcon}>
                  {ACCOUNT_TYPE_ICONS[account.type]}
                </div>
                <div className={styles.accountInfo}>
                  <Text weight="medium">{account.name}</Text>
                  <Text size="xs" color="secondary">
                    {ACCOUNT_TYPE_LABELS[account.type]} · {account.currency}
                  </Text>
                </div>
                <CurrencyDisplay
                  amount={account.balance}
                  currency={account.currency}
                  size="sm"
                  weight="semibold"
                />
                <div className={styles.actions}>
                  <button
                    className={styles.iconBtn}
                    onClick={() => handleEdit(account)}
                    aria-label="Edit"
                  >
                    <PencilSimple size={16} />
                  </button>
                  <button
                    className={styles.iconBtn}
                    data-danger
                    onClick={() => deleteAccount(account.id)}
                    aria-label="Delete"
                  >
                    <Trash size={16} />
                  </button>
                </div>
              </div>
            ))}
          </Panel>
        </>
      )}

      <AccountFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        account={editing}
      />
    </div>
  );
}
