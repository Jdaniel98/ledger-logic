import { useEffect, useState, useMemo } from 'react';
import { CaretLeft, CaretRight, ChartPieSlice, Plus } from '@phosphor-icons/react';
import { Heading, Button, Panel, ProgressBar, EmptyState, Skeleton, CurrencyDisplay, Text, BarChart } from '../../components';
import { useBudgetsStore } from '../../stores/useBudgetsStore';
import { BudgetFormDialog } from './BudgetFormDialog';
import styles from './BudgetPage.module.css';

function formatMonth(month: string): string {
  const [year, mon] = month.split('-').map(Number);
  return new Date(year, mon - 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
}

function navigateMonth(month: string, delta: number): string {
  const [year, mon] = month.split('-').map(Number);
  const d = new Date(year, mon - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function BudgetPage() {
  const { activeBudget, currentMonth, isLoading, fetchBudgetForMonth, setCurrentMonth } = useBudgetsStore();
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    fetchBudgetForMonth(currentMonth);
  }, [currentMonth, fetchBudgetForMonth]);

  const handlePrev = () => setCurrentMonth(navigateMonth(currentMonth, -1));
  const handleNext = () => setCurrentMonth(navigateMonth(currentMonth, 1));

  const totalAllocated = activeBudget?.lines.reduce((sum, l) => sum + l.amount, 0) ?? 0;
  const totalSpent = activeBudget?.lines.reduce((sum, l) => sum + l.spent, 0) ?? 0;

  const budgetBarData = useMemo(() => {
    if (!activeBudget) return [];
    return activeBudget.lines.map((line) => ({
      label: line.categoryName.length > 8 ? `${line.categoryName.slice(0, 8)}…` : line.categoryName,
      values: [
        { key: 'Allocated', value: line.amount, color: 'var(--color-accent)' },
        { key: 'Spent', value: line.spent, color: line.spent > line.amount ? 'var(--color-danger)' : 'var(--color-warning)' },
      ],
    }));
  }, [activeBudget]);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <Heading level={2} size="lg" weight="semibold">Budget</Heading>
        <div className={styles.monthNav}>
          <button className={styles.monthBtn} onClick={handlePrev} aria-label="Previous month">
            <CaretLeft size={18} />
          </button>
          <span className={styles.monthLabel}>{formatMonth(currentMonth)}</span>
          <button className={styles.monthBtn} onClick={handleNext} aria-label="Next month">
            <CaretRight size={18} />
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className={styles.skeletons}>
          <Skeleton variant="card" />
          <Skeleton variant="card" />
          <Skeleton variant="card" />
        </div>
      ) : !activeBudget ? (
        <EmptyState
          icon={<ChartPieSlice size={56} weight="duotone" />}
          heading={`No budget for ${formatMonth(currentMonth)}`}
          description="Create a monthly budget to set spending limits by category and track how you're doing."
          action={
            <Button variant="primary" icon={<Plus weight="bold" />} onClick={() => setDialogOpen(true)}>
              Create Budget
            </Button>
          }
        />
      ) : (
        <>
          <Panel>
            <div className={styles.summary}>
              <div>
                <Text size="sm" color="secondary">Total Allocated</Text>
                <CurrencyDisplay amount={totalAllocated} size="lg" weight="bold" />
              </div>
              <div>
                <Text size="sm" color="secondary">Total Spent</Text>
                <CurrencyDisplay amount={totalSpent} size="lg" weight="bold" colorize />
              </div>
              <div>
                <Text size="sm" color="secondary">Remaining</Text>
                <CurrencyDisplay amount={totalAllocated - totalSpent} size="lg" weight="bold" colorize />
              </div>
            </div>
            {totalAllocated > 0 && (
              <ProgressBar value={totalSpent} max={totalAllocated} showLabel />
            )}
          </Panel>

          <div className={styles.header}>
            <Text size="xs" weight="semibold" color="secondary" uppercase>
              Category Breakdown
            </Text>
            <Button variant="ghost" size="sm" onClick={() => setDialogOpen(true)}>
              Edit Budget
            </Button>
          </div>

          {/* Budget vs Actual Chart */}
          {budgetBarData.length > 0 && (
            <Panel className={styles.chartSection}>
              <Text size="xs" weight="semibold" color="secondary" uppercase>Allocated vs Spent</Text>
              <div className={styles.chartContainer}>
                <BarChart data={budgetBarData} width={Math.min(budgetBarData.length * 100, 540)} height={220} />
              </div>
            </Panel>
          )}

          <Panel padding={false}>
            {activeBudget.lines.map((line) => {
              const pct = line.amount > 0 ? (line.spent / line.amount) * 100 : 0;

              return (
                <div key={line.id} className={styles.lineRow}>
                  <div className={styles.lineInfo}>
                    {line.categoryColor && (
                      <span className={styles.dot} style={{ background: line.categoryColor }} />
                    )}
                    <Text weight="medium">{line.categoryName}</Text>
                  </div>
                  <div className={styles.lineAmounts}>
                    <CurrencyDisplay amount={line.spent} size="sm" weight="medium" />
                    <Text size="xs" color="secondary"> / </Text>
                    <CurrencyDisplay amount={line.amount} size="sm" color="secondary" />
                  </div>
                  <div className={styles.lineProgress}>
                    <ProgressBar value={line.spent} max={line.amount} />
                  </div>
                  <Text size="xs" color={pct > 100 ? 'danger' : 'secondary'} tabularNums>
                    {Math.round(pct)}%
                  </Text>
                </div>
              );
            })}
          </Panel>
        </>
      )}

      <BudgetFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        month={currentMonth}
        existingBudget={activeBudget}
      />
    </div>
  );
}
