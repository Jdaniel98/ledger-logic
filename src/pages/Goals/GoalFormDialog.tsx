import { useState, useEffect } from 'react';
import { Dialog, Input, Select, DatePicker, Button } from '../../components';
import type { SelectOption } from '../../components';
import { useAccountsStore } from '../../stores/useAccountsStore';
import type { SavingsGoal, CreateSavingsGoalData, UpdateSavingsGoalData } from '../../shared/types/models';
import formStyles from '../../styles/form-dialog.module.css';

const GOAL_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16',
];

interface GoalFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goal?: SavingsGoal | null;
  onSubmit: (data: CreateSavingsGoalData | { id: string; data: UpdateSavingsGoalData }) => void;
}

export function GoalFormDialog({ open, onOpenChange, goal, onSubmit }: GoalFormDialogProps) {
  const { accounts, fetchAccounts } = useAccountsStore();

  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [accountId, setAccountId] = useState('');
  const [color, setColor] = useState(GOAL_COLORS[0]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEditing = !!goal;

  useEffect(() => {
    if (open) fetchAccounts();
  }, [open, fetchAccounts]);

  useEffect(() => {
    if (goal) {
      setName(goal.name);
      setTargetAmount(String(goal.targetAmount));
      setTargetDate(goal.targetDate ?? '');
      setAccountId(goal.accountId ?? '');
      setColor(goal.color ?? GOAL_COLORS[0]);
    } else {
      setName('');
      setTargetAmount('');
      setTargetDate('');
      setAccountId('');
      setColor(GOAL_COLORS[0]);
    }
    setErrors({});
  }, [goal, open]);

  const accountOptions: SelectOption[] = [
    { value: '', label: 'No linked account' },
    ...accounts.filter((a) => !a.isArchived).map((a) => ({ value: a.id, label: a.name })),
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!name.trim()) newErrors.name = 'Name is required';
    const parsedTarget = parseFloat(targetAmount);
    if (!targetAmount || isNaN(parsedTarget) || parsedTarget <= 0) {
      newErrors.targetAmount = 'Target must be greater than 0';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (isEditing && goal) {
      onSubmit({
        id: goal.id,
        data: {
          name: name.trim(),
          targetAmount: parsedTarget,
          targetDate: targetDate || null,
          accountId: accountId || null,
          color,
        },
      });
    } else {
      onSubmit({
        name: name.trim(),
        targetAmount: parsedTarget,
        targetDate: targetDate || undefined,
        accountId: accountId || undefined,
        color,
      });
    }

    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={isEditing ? 'Edit Goal' : 'Add Goal'}
      size="sm"
    >
      <form onSubmit={handleSubmit} className={formStyles.form}>
        <Input
          label="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={errors.name}
          placeholder="e.g. Emergency Fund, Holiday"
        />

        <div className={formStyles.row}>
          <Input
            label="Target Amount"
            type="number"
            step="0.01"
            min="0"
            value={targetAmount}
            onChange={(e) => setTargetAmount(e.target.value)}
            error={errors.targetAmount}
            placeholder="0.00"
          />
          <DatePicker
            label="Target Date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
          />
        </div>

        <Select
          label="Linked Account"
          options={accountOptions}
          value={accountId}
          onChange={setAccountId}
        />

        <div>
          <span className={formStyles.colorLabel}>Color</span>
          <div className={formStyles.colorGrid}>
            {GOAL_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                className={formStyles.colorSwatch}
                style={{ background: c }}
                data-selected={color === c}
                onClick={() => setColor(c)}
                aria-label={`Color ${c}`}
              />
            ))}
          </div>
        </div>

        <Dialog.Footer>
          <Button variant="secondary" type="button" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="primary" type="submit">
            {isEditing ? 'Save' : 'Add Goal'}
          </Button>
        </Dialog.Footer>
      </form>
    </Dialog>
  );
}
