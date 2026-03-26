import { create } from 'zustand';
import type {
  Transaction,
  CreateTransactionData,
  UpdateTransactionData,
  TransactionFilters,
  PaginatedResult,
} from '../shared/types/models';

interface TransactionsState {
  transactions: Transaction[];
  total: number;
  page: number;
  pageSize: number;
  filters: TransactionFilters;
  isLoading: boolean;
  error: string | null;
  fetchTransactions: (filters?: TransactionFilters) => Promise<void>;
  createTransaction: (data: CreateTransactionData) => Promise<void>;
  updateTransaction: (id: string, data: UpdateTransactionData) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  setFilters: (filters: Partial<TransactionFilters>) => void;
  setPage: (page: number) => void;
}

export const useTransactionsStore = create<TransactionsState>((set, get) => ({
  transactions: [],
  total: 0,
  page: 1,
  pageSize: 50,
  filters: {},
  isLoading: false,
  error: null,

  fetchTransactions: async (filters) => {
    const currentFilters = filters ?? get().filters;
    const page = filters?.page ?? get().page;
    const pageSize = filters?.pageSize ?? get().pageSize;

    set({ isLoading: true, error: null });
    try {
      const result: PaginatedResult<Transaction> =
        await window.electronAPI.transactions.list({
          ...currentFilters,
          page,
          pageSize,
        });
      set({
        transactions: result.data,
        total: result.total,
        page: result.page,
        pageSize: result.pageSize,
        isLoading: false,
      });
    } catch {
      set({ error: 'Failed to load transactions', isLoading: false });
    }
  },

  createTransaction: async (data) => {
    set({ error: null });
    try {
      await window.electronAPI.transactions.create(data);
      // Refetch to get updated list and account balances
      await get().fetchTransactions();
    } catch {
      set({ error: 'Failed to create transaction' });
    }
  },

  updateTransaction: async (id, data) => {
    set({ error: null });
    try {
      await window.electronAPI.transactions.update(id, data);
      await get().fetchTransactions();
    } catch {
      set({ error: 'Failed to update transaction' });
    }
  },

  deleteTransaction: async (id) => {
    set({ error: null });
    try {
      await window.electronAPI.transactions.delete(id);
      await get().fetchTransactions();
    } catch {
      set({ error: 'Failed to delete transaction' });
    }
  },

  setFilters: (filters) => {
    set((state) => ({
      filters: { ...state.filters, ...filters },
      page: 1, // Reset to first page on filter change
    }));
  },

  setPage: (page) => {
    set({ page });
  },
}));
