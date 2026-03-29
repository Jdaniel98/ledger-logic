import { useState, useEffect } from 'react';
import { Paperclip, Eye, Trash } from '@phosphor-icons/react';
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
  { value: 'GHS', label: 'GHS' },
  { value: 'KES', label: 'KES' },
  { value: 'ZAR', label: 'ZAR' },
  { value: 'EGP', label: 'EGP' },
  { value: 'TZS', label: 'TZS' },
  { value: 'XOF', label: 'XOF' },
  { value: 'MAD', label: 'MAD' },
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
  const [receiptPath, setReceiptPath] = useState<string | null>(null);

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
      setReceiptPath(transaction.receiptPath ?? null);
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
      setReceiptPath(null);
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

        {isEditing && (
          <div>
            <Text size="xs" weight="medium" color="secondary">Receipt</Text>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginTop: 'var(--space-1)' }}>
              {receiptPath ? (
                <>
                  <Paperclip size={14} />
                  <Text size="xs" style={{ flex: 1 }}>
                    {receiptPath.split('/').pop()}
                  </Text>
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<Eye size={14} />}
                    onClick={() => transaction && window.electronAPI.receipts.open(transaction.id)}
                  >
                    View
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<Trash size={14} />}
                    onClick={async () => {
                      if (!transaction) return;
                      await window.electronAPI.transactions.update(transaction.id, {});
                      setReceiptPath(null);
                    }}
                  >
                    Remove
                  </Button>
                </>
              ) : (
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<Paperclip size={14} />}
                  onClick={async () => {
                    if (!transaction) return;
                    const filePath = await window.electronAPI.receipts.pickFile();
                    if (filePath) {
                      const savedPath = await window.electronAPI.receipts.attach(transaction.id, filePath);
                      setReceiptPath(savedPath);
                    }
                  }}
                >
                  Attach Receipt
                </Button>
              )}
            </div>
          </div>
        )}

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
