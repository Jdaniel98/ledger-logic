import { useState, useEffect } from 'react';
import { Dialog, Input, Select, DatePicker, TextArea, Button, Text } from '../../components';
import type { SelectOption } from '../../components';
import { useAccountsStore } from '../../stores/useAccountsStore';
import { useCategoriesStore } from '../../stores/useCategoriesStore';
import { useSettingsStore } from '../../stores/useSettingsStore';
import type { Transaction, CreateTransactionData, UpdateTransactionData, TransactionType } from '../../shared/types/models';
import formStyles from '../../styles/form-dialog.module.css';

const CURRENCY_OPTIONS: SelectOption[] = [
  { value: 'GBP', label: 'GBP' },
  { value: 'USD', label: 'USD' },
  { value: 'EUR', label: 'EUR' },
  { value: 'CAD', label: 'CAD' },
  { value: 'AUD', label: 'AUD' },
  { value: 'JPY', label: 'JPY' },
  { value: 'CHF', label: 'CHF' },
  { value: 'NGN', label: 'NGN' },
];

interface TransactionFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction?: Transaction | null;
  onSubmit: (data: CreateTransactionData | { id: string; data: UpdateTransactionData }) => void;
}

const TRANSACTION_TYPE_OPTIONS: SelectOption[] = [
  { value: 'expense', label: 'Expense' },
  { value: 'income', label: 'Income' },
];

function getTodayISO(): string {
  return new Date().toISOString().split('T')[0];
}

export function TransactionFormDialog({
  open,
  onOpenChange,
  transaction,
  onSubmit,
}: TransactionFormDialogProps) {
  const { accounts, fetchAccounts } = useAccountsStore();
  const { categories, fetchCategories } = useCategoriesStore();
  const { settings } = useSettingsStore();
  const baseCurrency = settings.baseCurrency ?? 'GBP';

  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TransactionType>('expense');
  const [date, setDate] = useState(getTodayISO());
  const [payee, setPayee] = useState('');
  const [accountId, setAccountId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [currency, setCurrency] = useState(baseCurrency);
  const [notes, setNotes] = useState('');
  const [tags, setTags] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEditing = !!transaction;

  useEffect(() => {
    if (open) {
      fetchAccounts();
      fetchCategories();
    }
  }, [open, fetchAccounts, fetchCategories]);

  useEffect(() => {
    if (transaction) {
      setAmount(String(transaction.amount));
      setType(transaction.type);
      setDate(transaction.date);
      setPayee(transaction.payee ?? '');
      setAccountId(transaction.accountId);
      setCategoryId(transaction.categoryId ?? '');
      setCurrency(transaction.currency ?? baseCurrency);
      setNotes(transaction.notes ?? '');
      setTags(transaction.tags?.join(', ') ?? '');
    } else {
      setAmount('');
      setType('expense');
      setDate(getTodayISO());
      setPayee('');
      setAccountId(accounts[0]?.id ?? '');
      setCategoryId('');
      setCurrency(baseCurrency);
      setNotes('');
      setTags('');
    }
    setErrors({});
  }, [transaction, open, accounts, baseCurrency]);

  const accountOptions: SelectOption[] = accounts
    .filter((a) => !a.isArchived)
    .map((a) => ({ value: a.id, label: a.name }));

  const categoryOptions: SelectOption[] = categories
    .filter((c) => c.type === type || type === 'transfer')
    .map((c) => ({
      value: c.id,
      label: c.name,
      indent: !!c.parentId,
    }));

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    const parsedAmount = parseFloat(amount);

    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }
    if (!date) {
      newErrors.date = 'Date is required';
    }
    if (!accountId) {
      newErrors.accountId = 'Account is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const parsedTags = tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const currencyValue = currency !== baseCurrency ? currency : undefined;

    if (isEditing && transaction) {
      onSubmit({
        id: transaction.id,
        data: {
          amount: parseFloat(amount),
          type,
          date,
          payee: payee || undefined,
          accountId,
          categoryId: categoryId || undefined,
          currency: currencyValue,
          notes: notes || undefined,
          tags: parsedTags.length > 0 ? parsedTags : undefined,
        },
      });
    } else {
      onSubmit({
        amount: parseFloat(amount),
        type,
        date,
        payee: payee || undefined,
        accountId,
        categoryId: categoryId || undefined,
        currency: currencyValue,
        notes: notes || undefined,
        tags: parsedTags.length > 0 ? parsedTags : undefined,
      } as CreateTransactionData);
    }

    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={isEditing ? 'Edit Transaction' : 'Add Transaction'}
    >
      <form onSubmit={handleSubmit} className={formStyles.form}>
        <div className={formStyles.row}>
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
            label="Type"
            options={TRANSACTION_TYPE_OPTIONS}
            value={type}
            onChange={(v) => setType(v as TransactionType)}
          />
        </div>

        <div className={formStyles.row}>
          <DatePicker
            label="Date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            error={errors.date}
          />
          <Input
            label="Payee"
            value={payee}
            onChange={(e) => setPayee(e.target.value)}
            placeholder="e.g. Tesco, Amazon"
          />
        </div>

        <div className={formStyles.row}>
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
            placeholder="Select category"
          />
        </div>

        <Select
          label="Currency"
          options={CURRENCY_OPTIONS}
          value={currency}
          onChange={setCurrency}
        />
        {currency !== baseCurrency && (
          <Text size="xs" color="secondary">
            Will be converted to {baseCurrency} at the current exchange rate
          </Text>
        )}

        <TextArea
          label="Notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Optional notes..."
        />

        <Input
          label="Tags"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="Comma-separated, e.g. groceries, weekly"
        />

        <Dialog.Footer>
          <Button variant="secondary" type="button" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="primary" type="submit">
            {isEditing ? 'Save Changes' : 'Add Transaction'}
          </Button>
        </Dialog.Footer>
      </form>
    </Dialog>
  );
}
