import { useEffect, useState, useCallback } from 'react';
import { Receipt, Plus, MagnifyingGlass } from '@phosphor-icons/react';
import { Heading, Button, Panel, DataRow, Badge, Input, Pagination, EmptyState, Skeleton, CurrencyDisplay } from '../../components';
import { Select } from '../../components/Select/Select';
import type { SelectOption } from '../../components/Select/Select';
import { useTransactionsStore } from '../../stores/useTransactionsStore';
import { useAccountsStore } from '../../stores/useAccountsStore';
import { useCategoriesStore } from '../../stores/useCategoriesStore';
import { TransactionFormDialog } from './TransactionFormDialog';
import type { Transaction, CreateTransactionData, UpdateTransactionData } from '../../shared/types/models';
import styles from './TransactionsPage.module.css';

export function TransactionsPage() {
  const {
    transactions,
    total,
    page,
    pageSize,
    filters,
    isLoading,
    fetchTransactions,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    setFilters,
    setPage,
  } = useTransactionsStore();

  const { accounts, fetchAccounts } = useAccountsStore();
  const { categories, fetchCategories } = useCategoriesStore();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [searchInput, setSearchInput] = useState('');

  useEffect(() => {
    fetchAccounts();
    fetchCategories();
  }, [fetchAccounts, fetchCategories]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions, filters, page]);

  const totalPages = Math.ceil(total / pageSize);

  const handleAdd = () => {
    setEditingTransaction(null);
    setDialogOpen(true);
  };

  const handleEdit = (txn: Transaction) => {
    setEditingTransaction(txn);
    setDialogOpen(true);
  };

  const handleSubmit = async (data: CreateTransactionData | { id: string; data: UpdateTransactionData }) => {
    if ('id' in data) {
      await updateTransaction(data.id, data.data);
    } else {
      await createTransaction(data);
    }
    // Refetch accounts to update balances in UI
    fetchAccounts();
  };

  const handleDelete = async (id: string) => {
    await deleteTransaction(id);
    fetchAccounts();
  };

  const handleSearch = useCallback(() => {
    setFilters({ search: searchInput || undefined });
  }, [searchInput, setFilters]);

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  const accountMap = new Map(accounts.map((a) => [a.id, a]));
  const categoryMap = new Map(categories.map((c) => [c.id, c]));

  const accountOptions: SelectOption[] = [
    { value: '__all__', label: 'All Accounts' },
    ...accounts.filter((a) => !a.isArchived).map((a) => ({ value: a.id, label: a.name })),
  ];

  const categoryOptions: SelectOption[] = [
    { value: '__all__', label: 'All Categories' },
    ...categories.map((c) => ({ value: c.id, label: c.name })),
  ];

  // Month options: current month + 5 previous
  const monthOptions: SelectOption[] = (() => {
    const opts: SelectOption[] = [{ value: '__all__', label: 'All Months' }];
    const now = new Date();
    for (let i = 0; i < 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
      opts.push({ value: val, label });
    }
    return opts;
  })();

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <Heading level={2} size="lg" weight="semibold">
          Transactions
        </Heading>
        <Button variant="primary" icon={<Plus weight="bold" />} onClick={handleAdd}>
          Add Transaction
        </Button>
      </div>

      <div className={styles.filters}>
        <Select
          options={accountOptions}
          value={filters.accountId ?? '__all__'}
          onChange={(v) => setFilters({ accountId: v === '__all__' ? undefined : v })}
          size="sm"
          placeholder="All Accounts"
        />
        <Select
          options={categoryOptions}
          value={filters.categoryId ?? '__all__'}
          onChange={(v) => setFilters({ categoryId: v === '__all__' ? undefined : v })}
          size="sm"
          placeholder="All Categories"
        />
        <Select
          options={monthOptions}
          value={filters.month ?? '__all__'}
          onChange={(v) => setFilters({ month: v === '__all__' ? undefined : v })}
          size="sm"
          placeholder="All Months"
        />
        <div className={styles.searchGroup}>
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            placeholder="Search payee, notes..."
            size="sm"
          />
          <button className={styles.searchBtn} onClick={handleSearch} aria-label="Search">
            <MagnifyingGlass size={16} />
          </button>
        </div>
      </div>

      {isLoading ? (
        <Panel>
          <div className={styles.skeletonList}>
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} variant="line" height="40px" />
            ))}
          </div>
        </Panel>
      ) : transactions.length === 0 ? (
        <EmptyState
          icon={<Receipt size={56} weight="duotone" />}
          heading="No transactions yet"
          description="Start tracking your spending by adding your first transaction. Every journey to financial clarity begins with a single entry."
          action={
            <Button variant="primary" icon={<Plus weight="bold" />} onClick={handleAdd}>
              Add Transaction
            </Button>
          }
        />
      ) : (
        <>
          <Panel padding={false}>
            {transactions.map((txn) => {
              const category = txn.categoryId ? categoryMap.get(txn.categoryId) : null;
              const account = accountMap.get(txn.accountId);

              return (
                <div key={txn.id} className={styles.row}>
                  <DataRow
                    label={txn.payee || txn.description || 'Untitled'}
                    sublabel={new Date(txn.date).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                    })}
                    icon={
                      category?.color ? (
                        <span
                          className={styles.categoryDot}
                          style={{ background: category.color }}
                        />
                      ) : undefined
                    }
                    value=""
                    rightSlot={
                      <div className={styles.rowRight}>
                        {account && (
                          <Badge variant="general">{account.name}</Badge>
                        )}
                        <CurrencyDisplay
                          amount={txn.type === 'expense' ? -txn.amount : txn.amount}
                          currency={txn.currency ?? account?.currency ?? 'GBP'}
                          colorize
                          weight="medium"
                        />
                        <button
                          className={styles.deleteBtn}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(txn.id);
                          }}
                          aria-label="Delete transaction"
                        >
                          ×
                        </button>
                      </div>
                    }
                    onClick={() => handleEdit(txn)}
                  />
                </div>
              );
            })}
          </Panel>

          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={(p) => {
              setPage(p);
              fetchTransactions({ ...filters, page: p, pageSize });
            }}
          />
        </>
      )}

      <TransactionFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        transaction={editingTransaction}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
