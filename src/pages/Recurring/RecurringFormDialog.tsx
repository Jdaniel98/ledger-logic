import { useState, useEffect } from 'react';
import { Dialog, Input, Select, Button, DatePicker } from '../../components';
import type { SelectOption } from '../../components';
import { useRecurringStore } from '../../stores/useRecurringStore';
import { useAccountsStore } from '../../stores/useAccountsStore';
import { useCategoriesStore } from '../../stores/useCategoriesStore';
import type { RecurringTemplate } from '../../shared/types/models';

interface RecurringFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template?: RecurringTemplate | null;
}

const FREQUENCY_OPTIONS: SelectOption[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Every 2 weeks' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
];

const AMOUNT_TYPE_OPTIONS: SelectOption[] = [
  { value: 'fixed', label: 'Fixed' },
  { value: 'estimated', label: 'Estimated' },
  { value: 'variable', label: 'Variable (manual)' },
];

const TYPE_OPTIONS: SelectOption[] = [
  { value: 'expense', label: 'Expense' },
  { value: 'income', label: 'Income' },
];

export function RecurringFormDialog({ open, onOpenChange, template }: RecurringFormDialogProps) {
  const { createTemplate, updateTemplate, fetchTemplates } = useRecurringStore();
  const { accounts, fetchAccounts } = useAccountsStore();
  const { categories, fetchCategories } = useCategoriesStore();

  const [payee, setPayee] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [accountId, setAccountId] = useState('');
  const [categoryId, setCategoryId] = useState('__none__');
  const [frequency, setFrequency] = useState('monthly');
  const [amountType, setAmountType] = useState('fixed');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEditing = !!template;

  useEffect(() => {
    if (open) {
      fetchAccounts();
      fetchCategories();
    }
  }, [open, fetchAccounts, fetchCategories]);

  useEffect(() => {
    if (template) {
      setPayee(template.payee ?? '');
      setAmount(String(template.amount));
      setType(template.type === 'transfer' ? 'expense' : template.type);
      setAccountId(template.accountId);
      setCategoryId(template.categoryId ?? '__none__');
      setFrequency(template.frequency);
      setAmountType(template.amountType);
      setStartDate(template.startDate);
      setEndDate(template.endDate ?? '');
      setDescription(template.description ?? '');
    } else {
      setPayee('');
      setAmount('');
      setType('expense');
      setAccountId('');
      setCategoryId('__none__');
      setFrequency('monthly');
      setAmountType('fixed');
      setStartDate(new Date().toISOString().split('T')[0]);
      setEndDate('');
      setDescription('');
    }
    setErrors({});
  }, [template, open]);

  const accountOptions: SelectOption[] = accounts.map((a) => ({
    value: a.id,
    label: a.name,
  }));

  const categoryOptions: SelectOption[] = [
    { value: '__none__', label: 'None' },
    ...categories
      .filter((c) => c.type === type && !c.parentId)
      .map((c) => ({ value: c.id, label: c.name })),
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) newErrors.amount = 'Amount must be positive';
    if (!accountId) newErrors.accountId = 'Account is required';
    if (!startDate) newErrors.startDate = 'Start date is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (isEditing && template) {
      await updateTemplate(template.id, {
        payee: payee || undefined,
        amount: parsedAmount,
        type,
        accountId,
        categoryId: categoryId === '__none__' ? null : categoryId,
        frequency: frequency as RecurringTemplate['frequency'],
        amountType: amountType as RecurringTemplate['amountType'],
        startDate,
        endDate: endDate || null,
        description: description || undefined,
      });
    } else {
      await createTemplate({
        payee: payee || undefined,
        amount: parsedAmount,
        type,
        accountId,
        categoryId: categoryId === '__none__' ? undefined : categoryId,
        frequency: frequency as RecurringTemplate['frequency'],
        amountType: amountType as RecurringTemplate['amountType'],
        startDate,
        endDate: endDate || undefined,
        description: description || undefined,
      });
    }

    await fetchTemplates();
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={isEditing ? 'Edit Recurring' : 'Add Recurring'}
      size="md"
    >
      <form
        onSubmit={handleSubmit}
        style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
          <Input
            label="Payee"
            value={payee}
            onChange={(e) => setPayee(e.target.value)}
            placeholder="e.g. Netflix, Rent"
          />
          <Select
            label="Type"
            options={TYPE_OPTIONS}
            value={type}
            onChange={(v) => setType(v as 'expense' | 'income')}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
          <Input
            label="Amount"
            type="number"
            step="0.01"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            error={errors.amount}
            placeholder="0.00"
          />
          <Select
            label="Amount Type"
            options={AMOUNT_TYPE_OPTIONS}
            value={amountType}
            onChange={setAmountType}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
          <Select
            label="Account"
            options={accountOptions}
            value={accountId}
            onChange={setAccountId}
            placeholder="Select account"
            error={errors.accountId}
          />
          <Select
            label="Category"
            options={categoryOptions}
            value={categoryId}
            onChange={setCategoryId}
            placeholder="None"
          />
        </div>

        <Select
          label="Frequency"
          options={FREQUENCY_OPTIONS}
          value={frequency}
          onChange={setFrequency}
        />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
          <DatePicker
            label="Start Date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            error={errors.startDate}
          />
          <DatePicker
            label="End Date (optional)"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>

        <Input
          label="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Notes about this recurring transaction"
        />

        <Dialog.Footer>
          <Button variant="secondary" type="button" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="primary" type="submit">
            {isEditing ? 'Save Changes' : 'Add Recurring'}
          </Button>
        </Dialog.Footer>
      </form>
    </Dialog>
  );
}
