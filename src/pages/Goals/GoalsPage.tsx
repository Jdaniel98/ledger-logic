import { useEffect, useState } from 'react';
import { Target, Plus, PencilSimple, Trash, ArrowFatUp } from '@phosphor-icons/react';
import {
  Heading, Button, Panel, Text, ProgressBar,
  CurrencyDisplay, EmptyState, Skeleton, Dialog, Input,
} from '../../components';
import { useSavingsGoalsStore } from '../../stores/useSavingsGoalsStore';
import { useAccountsStore } from '../../stores/useAccountsStore';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { GoalFormDialog } from './GoalFormDialog';
import type { SavingsGoal, CreateSavingsGoalData, UpdateSavingsGoalData } from '../../shared/types/models';
import styles from './GoalsPage.module.css';

function daysUntil(dateStr: string): number {
  const target = new Date(dateStr);
  const now = new Date();
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export function GoalsPage() {
  const { goals, isLoading, fetchGoals, createGoal, updateGoal, deleteGoal } = useSavingsGoalsStore();
  const { fetchAccounts, accounts } = useAccountsStore();
  const { settings } = useSettingsStore();
  const baseCurrency = settings.baseCurrency ?? 'GBP';

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<SavingsGoal | null>(null);
  const [contributeGoal, setContributeGoal] = useState<SavingsGoal | null>(null);
  const [contributeAmount, setContributeAmount] = useState('');

  useEffect(() => {
    fetchGoals();
    fetchAccounts();
  }, [fetchGoals, fetchAccounts]);

  const accountMap = new Map(accounts.map((a) => [a.id, a]));

  const handleAdd = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const handleEdit = (goal: SavingsGoal) => {
    setEditing(goal);
    setDialogOpen(true);
  };

  const handleSubmit = async (data: CreateSavingsGoalData | { id: string; data: UpdateSavingsGoalData }) => {
    if ('id' in data) {
      await updateGoal(data.id, data.data);
    } else {
      await createGoal(data);
    }
  };

  const handleContribute = async () => {
    if (!contributeGoal) return;
    const amount = parseFloat(contributeAmount);
    if (isNaN(amount) || amount <= 0) return;

    await updateGoal(contributeGoal.id, {
      currentAmount: contributeGoal.currentAmount + amount,
    });
    setContributeGoal(null);
    setContributeAmount('');
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <Heading level={2} size="lg" weight="semibold">Savings Goals</Heading>
        <Button variant="primary" icon={<Plus size={16} weight="bold" />} onClick={handleAdd}>
          Add Goal
        </Button>
      </div>

      {isLoading ? (
        <div className={styles.skeletons}>
          <Skeleton variant="card" />
          <Skeleton variant="card" />
          <Skeleton variant="card" />
        </div>
      ) : goals.length === 0 ? (
        <EmptyState
          icon={<Target size={56} weight="duotone" />}
          heading="No savings goals yet"
          description="Set a target and track your progress. Whether it's an emergency fund or a dream holiday, every pound saved brings you closer."
          action={
            <Button variant="primary" icon={<Plus weight="bold" />} onClick={handleAdd}>
              Add Goal
            </Button>
          }
        />
      ) : (
        <div className={styles.grid}>
          {goals.map((goal) => {
            const account = goal.accountId ? accountMap.get(goal.accountId) : null;
            const daysLeft = goal.targetDate ? daysUntil(goal.targetDate) : null;

            return (
              <Panel key={goal.id} className={styles.card} onClick={() => handleEdit(goal)}>
                <div className={styles.cardHeader}>
                  <div className={styles.cardTitle}>
                    <Text weight="semibold">{goal.name}</Text>
                    {account && (
                      <Text size="xs" color="secondary">{account.name}</Text>
                    )}
                  </div>
                  <div className={styles.cardActions}>
                    <button
                      className={styles.iconBtn}
                      onClick={(e) => {
                        e.stopPropagation();
                        setContributeGoal(goal);
                        setContributeAmount('');
                      }}
                      aria-label="Contribute"
                    >
                      <ArrowFatUp size={16} />
                    </button>
                    <button
                      className={styles.iconBtn}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(goal);
                      }}
                      aria-label="Edit"
                    >
                      <PencilSimple size={16} />
                    </button>
                    <button
                      className={styles.iconBtn}
                      data-danger
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteGoal(goal.id);
                      }}
                      aria-label="Delete"
                    >
                      <Trash size={16} />
                    </button>
                  </div>
                </div>

                <div className={styles.progressSection}>
                  <ProgressBar
                    value={goal.currentAmount}
                    max={goal.targetAmount}
                    showLabel
                  />
                  <div className={styles.progressLabels}>
                    <CurrencyDisplay amount={goal.currentAmount} currency={baseCurrency} size="sm" />
                    <CurrencyDisplay amount={goal.targetAmount} currency={baseCurrency} size="sm" color="secondary" />
                  </div>
                </div>

                {daysLeft !== null && (
                  <div className={styles.cardFooter}>
                    <Text size="xs" color="secondary">
                      {daysLeft > 0 ? `${daysLeft} days left` : daysLeft === 0 ? 'Due today' : 'Overdue'}
                    </Text>
                  </div>
                )}
              </Panel>
            );
          })}
        </div>
      )}

      <GoalFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        goal={editing}
        onSubmit={handleSubmit}
      />

      <Dialog
        open={!!contributeGoal}
        onOpenChange={(open) => { if (!open) setContributeGoal(null); }}
        title={`Contribute to ${contributeGoal?.name ?? ''}`}
        size="sm"
      >
        <div className={styles.contributeForm}>
          <Input
            label="Amount"
            type="number"
            step="0.01"
            min="0"
            value={contributeAmount}
            onChange={(e) => setContributeAmount(e.target.value)}
            placeholder="0.00"
          />
          <Dialog.Footer>
            <Button variant="secondary" onClick={() => setContributeGoal(null)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleContribute}>
              Contribute
            </Button>
          </Dialog.Footer>
        </div>
      </Dialog>
    </div>
  );
}
