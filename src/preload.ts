import { contextBridge, ipcRenderer } from 'electron';
import { IPC_CHANNELS } from './shared/types/ipc-channels';
import type {
  CreateAccountData,
  UpdateAccountData,
  CreateTransactionData,
  UpdateTransactionData,
  TransactionFilters,
  CreateCategoryData,
  UpdateCategoryData,
  CreateBudgetData,
  UpdateBudgetLineData,
  CreateRecurringTemplateData,
  UpdateRecurringTemplateData,
  CreateSavingsGoalData,
  UpdateSavingsGoalData,
  CreateDebtData,
  UpdateDebtData,
} from './shared/types/models';

contextBridge.exposeInMainWorld('electronAPI', {
  accounts: {
    list: () => ipcRenderer.invoke(IPC_CHANNELS.ACCOUNTS_LIST),
    create: (data: CreateAccountData) =>
      ipcRenderer.invoke(IPC_CHANNELS.ACCOUNTS_CREATE, data),
    update: (id: string, data: UpdateAccountData) =>
      ipcRenderer.invoke(IPC_CHANNELS.ACCOUNTS_UPDATE, id, data),
    delete: (id: string) =>
      ipcRenderer.invoke(IPC_CHANNELS.ACCOUNTS_DELETE, id),
  },
  transactions: {
    list: (filters?: TransactionFilters) =>
      ipcRenderer.invoke(IPC_CHANNELS.TRANSACTIONS_LIST, filters),
    create: (data: CreateTransactionData) =>
      ipcRenderer.invoke(IPC_CHANNELS.TRANSACTIONS_CREATE, data),
    update: (id: string, data: UpdateTransactionData) =>
      ipcRenderer.invoke(IPC_CHANNELS.TRANSACTIONS_UPDATE, id, data),
    delete: (id: string) =>
      ipcRenderer.invoke(IPC_CHANNELS.TRANSACTIONS_DELETE, id),
  },
  categories: {
    list: () => ipcRenderer.invoke(IPC_CHANNELS.CATEGORIES_LIST),
    create: (data: CreateCategoryData) =>
      ipcRenderer.invoke(IPC_CHANNELS.CATEGORIES_CREATE, data),
    update: (id: string, data: UpdateCategoryData) =>
      ipcRenderer.invoke(IPC_CHANNELS.CATEGORIES_UPDATE, id, data),
    delete: (id: string) =>
      ipcRenderer.invoke(IPC_CHANNELS.CATEGORIES_DELETE, id),
  },
  budgets: {
    list: (month?: string) =>
      ipcRenderer.invoke(IPC_CHANNELS.BUDGETS_LIST, month),
    get: (month: string) =>
      ipcRenderer.invoke(IPC_CHANNELS.BUDGETS_GET, month),
    create: (data: CreateBudgetData) =>
      ipcRenderer.invoke(IPC_CHANNELS.BUDGETS_CREATE, data),
    update: (id: string, data: Partial<CreateBudgetData>) =>
      ipcRenderer.invoke(IPC_CHANNELS.BUDGETS_UPDATE, id, data),
    delete: (id: string) =>
      ipcRenderer.invoke(IPC_CHANNELS.BUDGETS_DELETE, id),
    getRollover: (month: string) =>
      ipcRenderer.invoke(IPC_CHANNELS.BUDGETS_GET_ROLLOVER, month),
  },
  budgetLines: {
    update: (id: string, data: UpdateBudgetLineData) =>
      ipcRenderer.invoke(IPC_CHANNELS.BUDGET_LINES_UPDATE, id, data),
    delete: (id: string) =>
      ipcRenderer.invoke(IPC_CHANNELS.BUDGET_LINES_DELETE, id),
  },
  recurring: {
    list: () => ipcRenderer.invoke(IPC_CHANNELS.RECURRING_LIST),
    create: (data: CreateRecurringTemplateData) =>
      ipcRenderer.invoke(IPC_CHANNELS.RECURRING_CREATE, data),
    update: (id: string, data: UpdateRecurringTemplateData) =>
      ipcRenderer.invoke(IPC_CHANNELS.RECURRING_UPDATE, id, data),
    delete: (id: string) =>
      ipcRenderer.invoke(IPC_CHANNELS.RECURRING_DELETE, id),
    generate: () => ipcRenderer.invoke(IPC_CHANNELS.RECURRING_GENERATE),
  },
  settings: {
    get: (key: string) =>
      ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_GET, key),
    set: (key: string, value: string) =>
      ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_SET, key, value),
  },
  dashboard: {
    summary: (month: string) =>
      ipcRenderer.invoke(IPC_CHANNELS.DASHBOARD_SUMMARY, month),
  },
  export: {
    transactionsCsv: (filters?: { dateFrom?: string; dateTo?: string; accountId?: string }) =>
      ipcRenderer.invoke(IPC_CHANNELS.EXPORT_TRANSACTIONS_CSV, filters),
  },
  exchange: {
    getRates: (base: string) =>
      ipcRenderer.invoke(IPC_CHANNELS.EXCHANGE_RATES_GET, base),
    refreshRates: (base: string) =>
      ipcRenderer.invoke(IPC_CHANNELS.EXCHANGE_RATES_REFRESH, base),
    convert: (from: string, to: string, amount: number) =>
      ipcRenderer.invoke(IPC_CHANNELS.EXCHANGE_RATE_CONVERT, from, to, amount),
  },
  savingsGoals: {
    list: () => ipcRenderer.invoke(IPC_CHANNELS.SAVINGS_GOALS_LIST),
    create: (data: CreateSavingsGoalData) =>
      ipcRenderer.invoke(IPC_CHANNELS.SAVINGS_GOALS_CREATE, data),
    update: (id: string, data: UpdateSavingsGoalData) =>
      ipcRenderer.invoke(IPC_CHANNELS.SAVINGS_GOALS_UPDATE, id, data),
    delete: (id: string) =>
      ipcRenderer.invoke(IPC_CHANNELS.SAVINGS_GOALS_DELETE, id),
  },
  debts: {
    list: () => ipcRenderer.invoke(IPC_CHANNELS.DEBTS_LIST),
    create: (data: CreateDebtData) =>
      ipcRenderer.invoke(IPC_CHANNELS.DEBTS_CREATE, data),
    update: (id: string, data: UpdateDebtData) =>
      ipcRenderer.invoke(IPC_CHANNELS.DEBTS_UPDATE, id, data),
    delete: (id: string) =>
      ipcRenderer.invoke(IPC_CHANNELS.DEBTS_DELETE, id),
  },
  analytics: {
    spendingTrends: (months?: number) =>
      ipcRenderer.invoke(IPC_CHANNELS.ANALYTICS_SPENDING_TRENDS, months),
    categoryBreakdown: (month: string) =>
      ipcRenderer.invoke(IPC_CHANNELS.ANALYTICS_CATEGORY_BREAKDOWN, month),
    netWorth: (months?: number) =>
      ipcRenderer.invoke(IPC_CHANNELS.ANALYTICS_NET_WORTH, months),
    dailySpending: (month: string) =>
      ipcRenderer.invoke(IPC_CHANNELS.ANALYTICS_DAILY_SPENDING, month),
  },
  receipts: {
    attach: (transactionId: string, filePath: string) =>
      ipcRenderer.invoke(IPC_CHANNELS.TRANSACTIONS_ATTACH_RECEIPT, transactionId, filePath),
    open: (transactionId: string) =>
      ipcRenderer.invoke(IPC_CHANNELS.TRANSACTIONS_OPEN_RECEIPT, transactionId),
    pickFile: () =>
      ipcRenderer.invoke(IPC_CHANNELS.DIALOG_OPEN_FILE),
  },
  sync: {
    export: (folderPath: string) =>
      ipcRenderer.invoke(IPC_CHANNELS.SYNC_EXPORT, folderPath),
    import: (folderPath: string) =>
      ipcRenderer.invoke(IPC_CHANNELS.SYNC_IMPORT, folderPath),
    check: (folderPath: string) =>
      ipcRenderer.invoke(IPC_CHANNELS.SYNC_CHECK, folderPath),
    pickFolder: () =>
      ipcRenderer.invoke(IPC_CHANNELS.SYNC_PICK_FOLDER),
  },
  notifications: {
    onNavigate: (callback: (view: string) => void) => {
      const handler = (_event: unknown, view: string) => callback(view);
      ipcRenderer.on(IPC_CHANNELS.NOTIFICATION_NAVIGATE, handler);
      return () => {
        ipcRenderer.removeListener(IPC_CHANNELS.NOTIFICATION_NAVIGATE, handler);
      };
    },
  },
  platform: {
    getInfo: () => ipcRenderer.invoke(IPC_CHANNELS.PLATFORM_INFO),
  },
});
