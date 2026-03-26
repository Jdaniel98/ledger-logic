import { useEffect } from 'react';
import { Heading, Panel, Text, CurrencyDisplay, Skeleton, Sparkline, BudgetRing, ProgressBar } from '../../components';
import { useDashboardStore } from '../../stores/useDashboardStore';
import styles from './DashboardPage.module.css';

function formatMonth(month: string): string {
  const [year, mon] = month.split('-').map(Number);
  return new Date(year, mon - 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
}

export function DashboardPage() {
  const { summary, currentMonth, isLoading, fetchSummary } = useDashboardStore();

  useEffect(() => {
    fetchSummary(currentMonth);
  }, [currentMonth, fetchSummary]);

  if (isLoading) {
    return (
      <div className={styles.page}>
        <Heading level={2} size="lg" weight="semibold">Dashboard</Heading>
        <div className={styles.skeletons}>
          <Skeleton variant="card" />
          <Skeleton variant="card" />
          <Skeleton variant="card" />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <Heading level={2} size="lg" weight="semibold">Dashboard</Heading>
        <Text size="sm" color="secondary">{formatMonth(currentMonth)}</Text>
      </div>

      {/* Stat cards */}
      <div className={styles.statGrid}>
        <Panel>
          <div className={styles.statCard}>
            <Text size="sm" color="secondary">Total Income</Text>
            <CurrencyDisplay amount={summary?.totalIncome ?? 0} size="lg" weight="bold" />
          </div>
        </Panel>
        <Panel>
          <div className={styles.statCard}>
            <Text size="sm" color="secondary">Total Spent</Text>
            <CurrencyDisplay amount={summary?.totalExpense ?? 0} size="lg" weight="bold" colorize />
          </div>
        </Panel>
        <Panel>
          <div className={styles.statCard}>
            <Text size="sm" color="secondary">Remaining</Text>
            <CurrencyDisplay amount={summary?.remaining ?? 0} size="lg" weight="bold" colorize />
          </div>
        </Panel>
      </div>

      {/* Budget ring + overspend */}
      {summary && summary.categoryBreakdown.length > 0 ? (
        <Panel>
          <div className={styles.heroRow}>
            <div className={styles.ringSection}>
              <BudgetRing categories={summary.categoryBreakdown} size={180} />
              {summary.budgetTotal > 0 && (
                <ProgressBar
                  value={summary.budgetSpent}
                  max={summary.budgetTotal}
                  showLabel
                />
              )}
            </div>
            <div>
              <Text size="xs" weight="semibold" color="secondary" uppercase>
                {summary.topOverspend.length > 0 ? 'Top Overspend' : 'Category Breakdown'}
              </Text>
              <div className={styles.overspendList}>
                {summary.topOverspend.length > 0
                  ? summary.topOverspend.map((cat) => (
                      <div key={cat.categoryId} className={styles.overspendItem}>
                        <span
                          className={styles.dot}
                          style={{ background: cat.categoryColor ?? 'var(--color-danger)' }}
                        />
                        <div className={styles.overspendDetails}>
                          <Text size="sm" weight="medium">{cat.categoryName}</Text>
                          <div className={styles.overspendAmounts}>
                            <CurrencyDisplay amount={cat.spent} size="sm" weight="medium" />
                            <Text size="xs" color="secondary"> / </Text>
                            <CurrencyDisplay amount={cat.allocated} size="sm" color="secondary" />
                            <Text size="xs" color="danger" weight="semibold">
                              +<CurrencyDisplay amount={cat.overspendAmount} size="sm" />
                            </Text>
                          </div>
                        </div>
                      </div>
                    ))
                  : summary.categoryBreakdown.slice(0, 5).map((cat) => (
                      <div key={cat.categoryId} className={styles.overspendItem}>
                        <span
                          className={styles.dot}
                          style={{ background: cat.categoryColor ?? 'var(--color-accent)' }}
                        />
                        <div className={styles.overspendDetails}>
                          <Text size="sm" weight="medium">{cat.categoryName}</Text>
                          <div className={styles.overspendAmounts}>
                            <CurrencyDisplay amount={cat.spent} size="sm" weight="medium" />
                            <Text size="xs" color="secondary"> / </Text>
                            <CurrencyDisplay amount={cat.allocated} size="sm" color="secondary" />
                          </div>
                        </div>
                      </div>
                    ))}
              </div>
            </div>
          </div>
        </Panel>
      ) : (
        <Panel>
          <div className={styles.noDataHero}>
            <Text size="sm" color="secondary">
              No budget set for {formatMonth(currentMonth)}. Create one from the Budget page.
            </Text>
          </div>
        </Panel>
      )}

      {/* Bottom row: accounts + recent transactions */}
      <div className={styles.bottomRow}>
        <Panel>
          <div className={styles.sectionHeader}>
            <Text size="xs" weight="semibold" color="secondary" uppercase>Accounts</Text>
          </div>
          <div className={styles.accountList}>
            {summary?.accountBalances.length === 0 && (
              <Text size="sm" color="secondary">No accounts yet.</Text>
            )}
            {summary?.accountBalances.map((acc) => (
              <div key={acc.id} className={styles.accountRow}>
                <div className={styles.accountInfo}>
                  <Text size="sm" weight="medium">{acc.name}</Text>
                  <Text size="xs" color="secondary">{acc.type}</Text>
                </div>
                <div className={styles.accountRight}>
                  <Sparkline
                    data={acc.sparklineData}
                    width={60}
                    height={20}
                    color={acc.balance >= 0 ? 'var(--color-success)' : 'var(--color-danger)'}
                  />
                  <CurrencyDisplay amount={acc.balance} size="sm" weight="semibold" />
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel>
          <div className={styles.sectionHeader}>
            <Text size="xs" weight="semibold" color="secondary" uppercase>Recent Transactions</Text>
          </div>
          <div className={styles.recentList}>
            {summary?.recentTransactions.length === 0 && (
              <Text size="sm" color="secondary">No transactions this month.</Text>
            )}
            {summary?.recentTransactions.map((tx) => (
              <div key={tx.id} className={styles.recentRow}>
                <div className={styles.recentInfo}>
                  <Text size="sm" weight="medium">
                    {tx.payee || tx.description || 'Transaction'}
                  </Text>
                  <Text size="xs" color="secondary">{tx.date}</Text>
                </div>
                <CurrencyDisplay
                  amount={tx.type === 'expense' ? -tx.amount : tx.amount}
                  size="sm"
                  weight="medium"
                  colorize
                />
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}
