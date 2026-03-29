import { useState, useEffect } from 'react';
import { Dialog, Input, Select, DatePicker, Button } from '../../components';
import type { SelectOption } from '../../components';
import { useAccountsStore } from '../../stores/useAccountsStore';
import type { Debt, DebtType, CreateDebtData, UpdateDebtData } from '../../shared/types/models';
import formStyles from '../../styles/form-dialog.module.css';

const DEBT_TYPE_OPTIONS: SelectOption[] = [
  { value: 'loan', label: 'Loan' },
  { value: 'credit_card', label: 'Credit Card' },
  { value: 'mortgage', label: 'Mortgage' },
  { value: 'other', label: 'Other' },
];

interface DebtFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  debt?: Debt | null;
  onSubmit: (data: CreateDebtData | { id: string; data: UpdateDebtData }) => void;
}

export function DebtFormDialog({ open, onOpenChange, debt, onSubmit }: DebtFormDialogProps) {
  const { accounts, fetchAccounts } = useAccountsStore();

  const [name, setName] = useState('');
  const [type, setType] = useState<DebtType>('loan');
  const [principal, setPrincipal] = useState('');
  const [balance, setBalance] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [minimumPayment, setMinimumPayment] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [accountId, setAccountId] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEditing = !!debt;

  useEffect(() => {
    if (open) fetchAccounts();
  }, [open, fetchAccounts]);

  useEffect(() => {
    if (debt) {
      setName(debt.name);
      setType(debt.type);
      setPrincipal(String(debt.principal));
      setBalance(String(debt.balance));
      setInterestRate(String(debt.interestRate));
      setMinimumPayment(String(debt.minimumPayment));
      setDueDate(debt.dueDate ?? '');
      setAccountId(debt.accountId ?? '');
    } else {
      setName('');
      setType('loan');
      setPrincipal('');
      setBalance('');
      setInterestRate('');
      setMinimumPayment('');
      setDueDate('');
      setAccountId('');
    }
    setErrors({});
  }, [debt, open]);

  const accountOptions: SelectOption[] = [
    { value: '', label: 'No linked account' },
    ...accounts.filter((a) => !a.isArchived).map((a) => ({ value: a.id, label: a.name })),
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!name.trim()) newErrors.name = 'Name is required';
    const parsedPrincipal = parseFloat(principal);
    if (!principal || isNaN(parsedPrincipal) || parsedPrincipal <= 0) {
      newErrors.principal = 'Principal must be greater than 0';
    }
    const parsedBalance = parseFloat(balance);
    if (!balance || isNaN(parsedBalance) || parsedBalance < 0) {
      newErrors.balance = 'Balance must be 0 or greater';
    }
    const parsedRate = parseFloat(interestRate);
    if (interestRate === '' || isNaN(parsedRate) || parsedRate < 0) {
      newErrors.interestRate = 'Interest rate must be 0 or greater';
    }
    const parsedMin = parseFloat(minimumPayment);
    if (!minimumPayment || isNaN(parsedMin) || parsedMin < 0) {
      newErrors.minimumPayment = 'Minimum payment must be 0 or greater';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (isEditing && debt) {
      onSubmit({
        id: debt.id,
        data: {
          name: name.trim(),
          type,
          principal: parsedPrincipal,
          balance: parsedBalance,
          interestRate: parsedRate,
          minimumPayment: parsedMin,
          dueDate: dueDate || null,
          accountId: accountId || null,
        },
      });
    } else {
      onSubmit({
        name: name.trim(),
        type,
        principal: parsedPrincipal,
        balance: parsedBalance,
        interestRate: parsedRate,
        minimumPayment: parsedMin,
        dueDate: dueDate || undefined,
        accountId: accountId || undefined,
      });
    }

    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={isEditing ? 'Edit Debt' : 'Add Debt'}
    >
      <form onSubmit={handleSubmit} className={formStyles.form}>
        <div className={formStyles.row}>
          <Input
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={errors.name}
            placeholder="e.g. Student Loan"
          />
          <Select
            label="Type"
            options={DEBT_TYPE_OPTIONS}
            value={type}
            onChange={(v) => setType(v as DebtType)}
          />
        </div>

        <div className={formStyles.row}>
          <Input
            label="Original Principal"
            type="number"
            step="0.01"
            min="0"
            value={principal}
            onChange={(e) => setPrincipal(e.target.value)}
            error={errors.principal}
            placeholder="0.00"
          />
          <Input
            label="Current Balance"
            type="number"
            step="0.01"
            min="0"
            value={balance}
            onChange={(e) => setBalance(e.target.value)}
            error={errors.balance}
            placeholder="0.00"
          />
        </div>

        <div className={formStyles.row}>
          <Input
            label="Interest Rate (%)"
            type="number"
            step="0.01"
            min="0"
            value={interestRate}
            onChange={(e) => setInterestRate(e.target.value)}
            error={errors.interestRate}
            placeholder="0.00"
          />
          <Input
            label="Minimum Payment"
            type="number"
            step="0.01"
            min="0"
            value={minimumPayment}
            onChange={(e) => setMinimumPayment(e.target.value)}
            error={errors.minimumPayment}
            placeholder="0.00"
          />
        </div>

        <div className={formStyles.row}>
          <DatePicker
            label="Next Due Date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
          <Select
            label="Linked Account"
            options={accountOptions}
            value={accountId}
            onChange={setAccountId}
          />
        </div>

        <Dialog.Footer>
          <Button variant="secondary" type="button" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="primary" type="submit">
            {isEditing ? 'Save' : 'Add Debt'}
          </Button>
        </Dialog.Footer>
      </form>
    </Dialog>
  );
}
