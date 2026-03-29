/* Domain types shared across the IPC boundary.
   These are plain objects — no ORM dependencies. */

// ── Accounts ──

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  currency: string;
  balance: number;
  icon: string | null;
  color: string | null;
  isArchived: boolean;
  sortOrder: number;
  createdAt: number;
  updatedAt: number;
}

export type AccountType = 'checking' | 'savings' | 'credit' | 'cash' | 'investment';

export interface CreateAccountData {
  name: string;
  type: AccountType;
  currency?: string;
  balance?: number;
  icon?: string;
  color?: string;
}

export interface UpdateAccountData {
  name?: string;
  type?: AccountType;
  currency?: string;
  balance?: number;
  icon?: string;
  color?: string;
  isArchived?: boolean;
  sortOrder?: number;
}

// ── Categories ──

export interface Category {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
  parentId: string | null;
  type: 'expense' | 'income';
  isSystem: boolean;
  sortOrder: number;
  createdAt: number;
  updatedAt: number;
}

export interface CategoryTreeNode extends Category {
  children: CategoryTreeNode[];
}

export interface CreateCategoryData {
  name: string;
  type: 'expense' | 'income';
  icon?: string;
  color?: string;
  parentId?: string;
}

export interface UpdateCategoryData {
  name?: string;
  type?: 'expense' | 'income';
  icon?: string;
  color?: string;
  parentId?: string | null;
  sortOrder?: number;
}

// ── Transactions ──

export type TransactionType = 'income' | 'expense' | 'transfer';

export interface Transaction {
  id: string;
  accountId: string;
  categoryId: string | null;
  amount: number;
  type: TransactionType;
  description: string | null;
  payee: string | null;
  date: string; // ISO 8601 date
  notes: string | null;
  tags: string[]; // parsed from JSON
  currency: string | null;
  baseAmount: number | null;
  receiptPath: string | null;
  isRecurring: boolean;
  recurringTemplateId: string | null;
  createdAt: number;
  updatedAt: number;
}

export interface CreateTransactionData {
  accountId: string;
  categoryId?: string;
  amount: number;
  type: TransactionType;
  description?: string;
  payee?: string;
  date: string;
  notes?: string;
  tags?: string[];
  currency?: string;
}

export interface UpdateTransactionData {
  accountId?: string;
  categoryId?: string | null;
  amount?: number;
  type?: TransactionType;
  description?: string;
  payee?: string;
  date?: string;
  notes?: string;
  tags?: string[];
  currency?: string;
}

export interface TransactionFilters {
  accountId?: string;
  categoryId?: string;
  month?: string; // 'YYYY-MM'
  search?: string;
  type?: TransactionType;
  tags?: string[];
  page?: number;
  pageSize?: number;
}

// ── Budgets ──

export interface Budget {
  id: string;
  name: string;
  month: string | null; // 'YYYY-MM'
  periodType: 'monthly' | 'weekly' | 'yearly';
  startDate: string;
  amount: number;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface BudgetWithLines extends Budget {
  lines: BudgetLineWithActual[];
}

export interface BudgetLine {
  id: string;
  budgetId: string;
  categoryId: string;
  amount: number;
  rolloverEnabled: boolean;
  sortOrder: number;
  createdAt: number;
  updatedAt: number;
}

export interface BudgetLineWithActual extends BudgetLine {
  categoryName: string;
  categoryIcon: string | null;
  categoryColor: string | null;
  spent: number;
  remaining: number;
}

export interface CreateBudgetData {
  name: string;
  month: string; // 'YYYY-MM'
  amount: number;
  lines: CreateBudgetLineData[];
}

export interface CreateBudgetLineData {
  categoryId: string;
  amount: number;
  rolloverEnabled?: boolean;
}

export interface UpdateBudgetLineData {
  amount?: number;
  rolloverEnabled?: boolean;
  sortOrder?: number;
}

// ── Recurring Templates ──

export type RecurringFrequency = 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly';
export type AmountType = 'fixed' | 'estimated' | 'variable';

export interface RecurringTemplate {
  id: string;
  accountId: string;
  categoryId: string | null;
  amount: number;
  type: TransactionType;
  description: string | null;
  payee: string | null;
  amountType: AmountType;
  frequency: RecurringFrequency;
  startDate: string;
  endDate: string | null;
  nextDueDate: string | null;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface CreateRecurringTemplateData {
  accountId: string;
  categoryId?: string;
  amount: number;
  type: TransactionType;
  description?: string;
  payee?: string;
  amountType?: AmountType;
  frequency: RecurringFrequency;
  startDate: string;
  endDate?: string;
}

export interface UpdateRecurringTemplateData {
  accountId?: string;
  categoryId?: string | null;
  amount?: number;
  type?: TransactionType;
  description?: string;
  payee?: string;
  amountType?: AmountType;
  frequency?: RecurringFrequency;
  startDate?: string;
  endDate?: string | null;
  isActive?: boolean;
}

// ── Dashboard ──

export interface DashboardSummary {
  totalIncome: number;
  totalExpense: number;
  remaining: number;
  burnRate: number;
  budgetTotal: number;
  budgetSpent: number;
  topOverspend: OverspendCategory[];
  accountBalances: AccountBalance[];
  categoryBreakdown: CategorySpending[];
  recentTransactions: Transaction[];
}

export interface OverspendCategory {
  categoryId: string;
  categoryName: string;
  categoryColor: string | null;
  allocated: number;
  spent: number;
  overspendAmount: number;
}

export interface AccountBalance {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  currency: string;
  sparklineData: number[];
}

export interface CategorySpending {
  categoryId: string;
  categoryName: string;
  categoryColor: string | null;
  spent: number;
  allocated: number;
}

// ── Pagination ──

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

// ── Savings Goals ──

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string | null;
  accountId: string | null;
  icon: string | null;
  color: string | null;
  createdAt: number;
  updatedAt: number;
}

export interface CreateSavingsGoalData {
  name: string;
  targetAmount: number;
  targetDate?: string;
  accountId?: string;
  icon?: string;
  color?: string;
}

export interface UpdateSavingsGoalData {
  name?: string;
  targetAmount?: number;
  currentAmount?: number;
  targetDate?: string | null;
  accountId?: string | null;
  icon?: string;
  color?: string;
}

// ── Debts ──

export type DebtType = 'loan' | 'credit_card' | 'mortgage' | 'other';

export interface Debt {
  id: string;
  name: string;
  type: DebtType;
  principal: number;
  balance: number;
  interestRate: number;
  minimumPayment: number;
  dueDate: string | null;
  accountId: string | null;
  createdAt: number;
  updatedAt: number;
}

export interface CreateDebtData {
  name: string;
  type: DebtType;
  principal: number;
  balance: number;
  interestRate: number;
  minimumPayment: number;
  dueDate?: string;
  accountId?: string;
}

export interface UpdateDebtData {
  name?: string;
  type?: DebtType;
  principal?: number;
  balance?: number;
  interestRate?: number;
  minimumPayment?: number;
  dueDate?: string | null;
  accountId?: string | null;
}

// ── Analytics ──

export interface SpendingTrend {
  month: string;
  income: number;
  expense: number;
}

export interface CategoryBreakdownItem {
  categoryId: string | null;
  categoryName: string;
  categoryColor: string | null;
  amount: number;
  percentage: number;
}

// ── Settings ──

export interface PlatformInfo {
  platform: string;
  version: string;
  arch: string;
}
