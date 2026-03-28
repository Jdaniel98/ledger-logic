import type {
  Account,
  CreateAccountData,
  UpdateAccountData,
  Transaction,
  CreateTransactionData,
  UpdateTransactionData,
  TransactionFilters,
  PaginatedResult,
  Category,
  CreateCategoryData,
  UpdateCategoryData,
  Budget,
  BudgetWithLines,
  CreateBudgetData,
  UpdateBudgetLineData,
  RecurringTemplate,
  CreateRecurringTemplateData,
  UpdateRecurringTemplateData,
  DashboardSummary,
  PlatformInfo,
} from './models';

export interface ElectronAPI {
  accounts: {
    list: () => Promise<Account[]>;
    create: (data: CreateAccountData) => Promise<Account>;
    update: (id: string, data: UpdateAccountData) => Promise<Account>;
    delete: (id: string) => Promise<void>;
  };
  transactions: {
    list: (filters?: TransactionFilters) => Promise<PaginatedResult<Transaction>>;
    create: (data: CreateTransactionData) => Promise<Transaction>;
    update: (id: string, data: UpdateTransactionData) => Promise<Transaction>;
    delete: (id: string) => Promise<void>;
  };
  categories: {
    list: () => Promise<Category[]>;
    create: (data: CreateCategoryData) => Promise<Category>;
    update: (id: string, data: UpdateCategoryData) => Promise<Category>;
    delete: (id: string) => Promise<void>;
  };
  budgets: {
    list: (month?: string) => Promise<Budget[]>;
    get: (month: string) => Promise<BudgetWithLines | null>;
    create: (data: CreateBudgetData) => Promise<BudgetWithLines>;
    update: (id: string, data: Partial<CreateBudgetData>) => Promise<BudgetWithLines>;
    delete: (id: string) => Promise<void>;
    getRollover: (month: string) => Promise<Record<string, number>>;
  };
  budgetLines: {
    update: (id: string, data: UpdateBudgetLineData) => Promise<void>;
    delete: (id: string) => Promise<void>;
  };
  recurring: {
    list: () => Promise<RecurringTemplate[]>;
    create: (data: CreateRecurringTemplateData) => Promise<RecurringTemplate>;
    update: (id: string, data: UpdateRecurringTemplateData) => Promise<RecurringTemplate>;
    delete: (id: string) => Promise<void>;
    generate: () => Promise<number>; // returns count of generated transactions
  };
  settings: {
    get: (key: string) => Promise<string | null>;
    set: (key: string, value: string) => Promise<void>;
  };
  dashboard: {
    summary: (month: string) => Promise<DashboardSummary>;
  };
  export: {
    transactionsCsv: (filters?: { dateFrom?: string; dateTo?: string; accountId?: string }) => Promise<{
      success: boolean;
      filePath?: string;
      count?: number;
      error?: string;
    }>;
  };
  exchange: {
    getRates: (base: string) => Promise<Record<string, number>>;
    refreshRates: (base: string) => Promise<Record<string, number>>;
    convert: (from: string, to: string, amount: number) => Promise<{ rate: number; converted: number }>;
  };
  platform: {
    getInfo: () => Promise<PlatformInfo>;
  };
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
