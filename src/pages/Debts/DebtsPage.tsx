import { useEffect, useState } from 'react';
import { CreditCard, Plus, PencilSimple, Trash, CurrencyGbp } from '@phosphor-icons/react';
import {
  Heading, Button, Panel, Text, Badge, ProgressBar,
  CurrencyDisplay, EmptyState, Skeleton, Dialog, Input,
} from '../../components';
import { useDebtsStore } from '../../stores/useDebtsStore';
import { useAccountsStore } from '../../stores/useAccountsStore';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { DebtFormDialog } from './DebtFormDialog';
import type { Debt, DebtType, CreateDebtData, UpdateDebtData } from '../../shared/types/models';
import styles from './DebtsPage.module.css';

const DEBT_TYPE_LABELS: Record<DebtType, string> = {
  loan: 'Loan',
  credit_card: 'Credit Card',
  mortgage: 'Mortgage',
  other: 'Other',
};

export function DebtsPage() {
  const { debts, isLoading, fetchDebts, createDebt, updateDebt, deleteDebt } = useDebtsStore();
  const { accounts, fetchAccounts } = useAccountsStore();
  const { settings } = useSettingsStore();
  const baseCurrency = settings.baseCurrency ?? 'GBP';

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Debt | null>(null);
  const [paymentDebt, setPaymentDebt] = useState<Debt | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');

  useEffect(() => {
    fetchDebts();
    fetchAccounts();
  }, [fetchDebts, fetchAccounts]);

  const accountMap = new Map(accounts.map((a) => [a.id, a]));
  const totalDebt = debts.reduce((sum, d) => sum + d.balance, 0);

  const handleAdd = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const handleEdit = (debt: Debt) => {
    setEditing(debt);
    setDialogOpen(true);
  };

  const handleSubmit = async (data: CreateDebtData | { id: string; data: UpdateDebtData }) => {
    if ('id' in data) {
      await updateDebt(data.id, data.data);
    } else {
      await createDebt(data);
    }
  };

  const handlePayment = async () => {
    if (!paymentDebt) return;
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) return;

    const newBalance = Math.max(0, paymentDebt.balance - amount);
    await updateDebt(paymentDebt.id, { balance: newBalance });
    setPaymentDebt(null);
    setPaymentAmount('');
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <Heading level={2} size="lg" weight="semibold">Debts</Heading>
        <Button variant="primary" icon={<Plus size={16} weight="bold" />} onClick={handleAdd}>
          Add Debt
        </Button>
      </div>

      {isLoading ? (
        <div className={styles.skeletons}>
          <Skeleton variant="card" />
          <Skeleton variant="card" />
        </div>
      ) : debts.length === 0 ? (
        <EmptyState
          icon={<CreditCard size={56} weight="duotone" />}
          heading="No debts tracked"
          description="Add your loans, credit cards, and mortgages to track payoff progress and stay on top of repayments."
          action={
            <Button variant="primary" icon={<Plus weight="bold" />} onClick={handleAdd}>
              Add Debt
            </Button>
          }
        />
      ) : (
        <>
          <Panel>
            <div className={styles.summaryRow}>
              <Text size="sm" color="secondary">Total Outstanding</Text>
              <CurrencyDisplay amount={totalDebt} currency={baseCurrency} size="lg" weight="bold" />
            </div>
          </Panel>

          <div className={styles.grid}>
            {debts.map((debt) => {
              const account = debt.accountId ? accountMap.get(debt.accountId) : null;
              const paidOff = debt.principal - debt.balance;
              const payoffPercent = debt.principal > 0 ? Math.round((paidOff / debt.principal) * 100) : 0;

              return (
                <Panel key={debt.id} className={styles.card} onClick={() => handleEdit(debt)}>
                  <div className={styles.cardHeader}>
                    <div className={styles.cardTitle}>
                      <Text weight="semibold">{debt.name}</Text>
                      <Badge variant="general">{DEBT_TYPE_LABELS[debt.type]}</Badge>
                    </div>
                    <div className={styles.cardActions}>
                      <button
                        className={styles.iconBtn}
                        onClick={(e) => {
                          e.stopPropagation();
                          setPaymentDebt(debt);
                          setPaymentAmount('');
                        }}
                        aria-label="Make payment"
                      >
                        <CurrencyGbp size={16} />
                      </button>
                      <button
                        className={styles.iconBtn}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(debt);
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
                          deleteDebt(debt.id);
                        }}
                        aria-label="Delete"
                      >
                        <Trash size={16} />
                      </button>
                    </div>
                  </div>

                  <div className={styles.progressSection}>
                    <ProgressBar value={paidOff} max={debt.principal} showLabel />
                    <div className={styles.progressLabels}>
                      <Text size="xs" color="secondary">{payoffPercent}% paid off</Text>
                      <CurrencyDisplay amount={debt.balance} currency={baseCurrency} size="sm" weight="medium" />
                    </div>
                  </div>

                  <div className={styles.detailsGrid}>
                    <div className={styles.detailItem}>
                      <Text size="xs" color="secondary">Interest Rate</Text>
                      <Text size="sm" weight="medium">{debt.interestRate}%</Text>
                    </div>
                    <div className={styles.detailItem}>
                      <Text size="xs" color="secondary">Min. Payment</Text>
                      <CurrencyDisplay amount={debt.minimumPayment} currency={baseCurrency} size="sm" />
                    </div>
                    {debt.dueDate && (
                      <div className={styles.detailItem}>
                        <Text size="xs" color="secondary">Next Due</Text>
                        <Text size="sm" weight="medium">
                          {new Date(debt.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                        </Text>
                      </div>
                    )}
                    {account && (
                      <div className={styles.detailItem}>
                        <Text size="xs" color="secondary">Account</Text>
                        <Text size="sm" weight="medium">{account.name}</Text>
                      </div>
                    )}
                  </div>
                </Panel>
              );
            })}
          </div>
        </>
      )}

      <DebtFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        debt={editing}
        onSubmit={handleSubmit}
      />

      <Dialog
        open={!!paymentDebt}
        onOpenChange={(open) => { if (!open) setPaymentDebt(null); }}
        title={`Payment — ${paymentDebt?.name ?? ''}`}
        size="sm"
      >
        <div className={styles.paymentForm}>
          <Input
            label="Payment Amount"
            type="number"
            step="0.01"
            min="0"
            value={paymentAmount}
            onChange={(e) => setPaymentAmount(e.target.value)}
            placeholder="0.00"
          />
          <Dialog.Footer>
            <Button variant="secondary" onClick={() => setPaymentDebt(null)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handlePayment}>
              Record Payment
            </Button>
          </Dialog.Footer>
        </div>
      </Dialog>
    </div>
  );
}
