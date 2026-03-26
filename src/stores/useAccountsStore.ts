import { create } from 'zustand';
import type { Account, CreateAccountData, UpdateAccountData } from '../shared/types/models';

interface AccountsState {
  accounts: Account[];
  isLoading: boolean;
  error: string | null;
  fetchAccounts: () => Promise<void>;
  createAccount: (data: CreateAccountData) => Promise<void>;
  updateAccount: (id: string, data: UpdateAccountData) => Promise<void>;
  deleteAccount: (id: string) => Promise<void>;
}

export const useAccountsStore = create<AccountsState>((set) => ({
  accounts: [],
  isLoading: false,
  error: null,

  fetchAccounts: async () => {
    set({ isLoading: true, error: null });
    try {
      const accounts = await window.electronAPI.accounts.list();
      set({ accounts, isLoading: false });
    } catch {
      set({ error: 'Failed to load accounts', isLoading: false });
    }
  },

  createAccount: async (data) => {
    set({ error: null });
    try {
      const account = await window.electronAPI.accounts.create(data);
      set((state) => ({ accounts: [...state.accounts, account] }));
    } catch {
      set({ error: 'Failed to create account' });
    }
  },

  updateAccount: async (id, data) => {
    set({ error: null });
    try {
      const updated = await window.electronAPI.accounts.update(id, data);
      set((state) => ({
        accounts: state.accounts.map((a) => (a.id === id ? updated : a)),
      }));
    } catch {
      set({ error: 'Failed to update account' });
    }
  },

  deleteAccount: async (id) => {
    set({ error: null });
    try {
      await window.electronAPI.accounts.delete(id);
      set((state) => ({
        accounts: state.accounts.filter((a) => a.id !== id),
      }));
    } catch {
      set({ error: 'Failed to delete account' });
    }
  },
}));
