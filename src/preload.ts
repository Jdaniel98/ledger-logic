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
  platform: {
    getInfo: () => ipcRenderer.invoke(IPC_CHANNELS.PLATFORM_INFO),
  },
});
