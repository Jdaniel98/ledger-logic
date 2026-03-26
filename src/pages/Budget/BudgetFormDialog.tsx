import { useState, useEffect } from 'react';
import { Dialog, Input, Button, Text } from '../../components';
import { useBudgetsStore } from '../../stores/useBudgetsStore';
import { useCategoriesStore } from '../../stores/useCategoriesStore';
import type { BudgetWithLines, CreateBudgetLineData } from '../../shared/types/models';
import styles from './BudgetFormDialog.module.css';

interface BudgetFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  month: string;
  existingBudget?: BudgetWithLines | null;
}

function formatMonthName(month: string): string {
  const [year, mon] = month.split('-').map(Number);
  return new Date(year, mon - 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
}

export function BudgetFormDialog({ open, onOpenChange, month, existingBudget }: BudgetFormDialogProps) {
  const { createBudget, updateBudget, fetchBudgetForMonth } = useBudgetsStore();
  const { categories, fetchCategories } = useCategoriesStore();

  const [lineAmounts, setLineAmounts] = useState<Record<string, string>>({});
  const [lineRollover, setLineRollover] = useState<Record<string, boolean>>({});

  const expenseCategories = categories.filter((c) => c.type === 'expense' && !c.parentId);

  useEffect(() => {
    if (open) fetchCategories();
  }, [open, fetchCategories]);

  useEffect(() => {
    if (existingBudget) {
      const amounts: Record<string, string> = {};
      const rollover: Record<string, boolean> = {};
      for (const line of existingBudget.lines) {
        amounts[line.categoryId] = String(line.amount);
        rollover[line.categoryId] = line.rolloverEnabled;
      }
      setLineAmounts(amounts);
      setLineRollover(rollover);
    } else {
      setLineAmounts({});
      setLineRollover({});
    }
  }, [existingBudget, open]);

  const total = Object.values(lineAmounts).reduce(
    (sum, val) => sum + (parseFloat(val) || 0),
    0,
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const lines: CreateBudgetLineData[] = expenseCategories
      .filter((c) => parseFloat(lineAmounts[c.id] ?? '0') > 0)
      .map((c) => ({
        categoryId: c.id,
        amount: parseFloat(lineAmounts[c.id]),
        rolloverEnabled: lineRollover[c.id] ?? false,
      }));

    if (lines.length === 0) return;

    if (existingBudget) {
      await updateBudget(existingBudget.id, {
        name: `${formatMonthName(month)} Budget`,
        month,
        amount: total,
        lines,
      });
    } else {
      await createBudget({
        name: `${formatMonthName(month)} Budget`,
        month,
        amount: total,
        lines,
      });
    }

    await fetchBudgetForMonth(month);
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={existingBudget ? 'Edit Budget' : `Create Budget — ${formatMonthName(month)}`}
      size="lg"
    >
      <form onSubmit={handleSubmit}>
        <div className={styles.lineList}>
          <div className={styles.lineHeader}>
            <Text size="xs" weight="semibold" color="secondary" uppercase>Category</Text>
            <Text size="xs" weight="semibold" color="secondary" uppercase>Allocated</Text>
            <Text size="xs" weight="semibold" color="secondary" uppercase>Rollover</Text>
          </div>

          {expenseCategories.map((cat) => (
            <div key={cat.id} className={styles.lineRow}>
              <div className={styles.catInfo}>
                {cat.color && (
                  <span className={styles.dot} style={{ background: cat.color }} />
                )}
                <Text size="sm" weight="medium">{cat.name}</Text>
              </div>
              <Input
                type="number"
                step="0.01"
                min="0"
                size="sm"
                value={lineAmounts[cat.id] ?? ''}
                onChange={(e) =>
                  setLineAmounts((prev) => ({ ...prev, [cat.id]: e.target.value }))
                }
                placeholder="0.00"
              />
              <label className={styles.checkbox}>
                <input
                  type="checkbox"
                  checked={lineRollover[cat.id] ?? false}
                  onChange={(e) =>
                    setLineRollover((prev) => ({ ...prev, [cat.id]: e.target.checked }))
                  }
                />
              </label>
            </div>
          ))}
        </div>

        <div className={styles.total}>
          <Text weight="semibold">Total</Text>
          <Text weight="bold" tabularNums>
            £{total.toFixed(2)}
          </Text>
        </div>

        <Dialog.Footer>
          <Button variant="secondary" type="button" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="primary" type="submit">
            {existingBudget ? 'Save Changes' : 'Create Budget'}
          </Button>
        </Dialog.Footer>
      </form>
    </Dialog>
  );
}
