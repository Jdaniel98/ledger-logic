import { useState, useEffect } from 'react';
import { Dialog, Input, Select, Button } from '../../components';
import type { SelectOption } from '../../components';
import { useAccountsStore } from '../../stores/useAccountsStore';
import type { Account } from '../../shared/types/models';
import formStyles from '../../styles/form-dialog.module.css';

interface AccountFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account?: Account | null;
}

const TYPE_OPTIONS: SelectOption[] = [
  { value: 'checking', label: 'Checking' },
  { value: 'savings', label: 'Savings' },
  { value: 'credit', label: 'Credit Card' },
  { value: 'cash', label: 'Cash' },
  { value: 'investment', label: 'Investment' },
];

const CURRENCY_OPTIONS: SelectOption[] = [
  { value: 'GBP', label: 'GBP — British Pound' },
  { value: 'USD', label: 'USD — US Dollar' },
  { value: 'EUR', label: 'EUR — Euro' },
  { value: 'CAD', label: 'CAD — Canadian Dollar' },
  { value: 'AUD', label: 'AUD — Australian Dollar' },
  { value: 'JPY', label: 'JPY — Japanese Yen' },
  { value: 'CHF', label: 'CHF — Swiss Franc' },
  { value: 'NGN', label: 'NGN — Nigerian Naira' },
  { value: 'GHS', label: 'GHS — Ghana Cedi' },
  { value: 'KES', label: 'KES — Kenyan Shilling' },
  { value: 'ZAR', label: 'ZAR — South African Rand' },
  { value: 'EGP', label: 'EGP — Egyptian Pound' },
  { value: 'TZS', label: 'TZS — Tanzanian Shilling' },
  { value: 'XOF', label: 'XOF — West African CFA Franc' },
  { value: 'MAD', label: 'MAD — Moroccan Dirham' },
];

export function AccountFormDialog({ open, onOpenChange, account }: AccountFormDialogProps) {
  const { createAccount, updateAccount } = useAccountsStore();

  const [name, setName] = useState('');
  const [type, setType] = useState('checking');
  const [currency, setCurrency] = useState('GBP');
  const [balance, setBalance] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEditing = !!account;

  useEffect(() => {
    if (account) {
      setName(account.name);
      setType(account.type);
      setCurrency(account.currency);
      setBalance(String(account.balance));
    } else {
      setName('');
      setType('checking');
      setCurrency('GBP');
      setBalance('0');
    }
    setErrors({});
  }, [account, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!name.trim()) newErrors.name = 'Name is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (isEditing && account) {
      await updateAccount(account.id, {
        name: name.trim(),
        type: type as Account['type'],
        currency,
      });
    } else {
      await createAccount({
        name: name.trim(),
        type: type as Account['type'],
        currency,
        balance: parseFloat(balance) || 0,
      });
    }

    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={isEditing ? 'Edit Account' : 'Add Account'}
      size="sm"
    >
      <form onSubmit={handleSubmit} className={formStyles.form}>
        <Input
          label="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={errors.name}
          placeholder="e.g. Main Current Account"
        />

        <Select
          label="Type"
          options={TYPE_OPTIONS}
          value={type}
          onChange={setType}
        />

        <Select
          label="Currency"
          options={CURRENCY_OPTIONS}
          value={currency}
          onChange={setCurrency}
        />

        {!isEditing && (
          <Input
            label="Opening Balance"
            type="number"
            step="0.01"
            value={balance}
            onChange={(e) => setBalance(e.target.value)}
            placeholder="0.00"
          />
        )}

        <Dialog.Footer>
          <Button variant="secondary" type="button" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="primary" type="submit">
            {isEditing ? 'Save' : 'Add Account'}
          </Button>
        </Dialog.Footer>
      </form>
    </Dialog>
  );
}
