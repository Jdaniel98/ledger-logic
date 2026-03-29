import { create } from 'zustand';
import type { Debt, CreateDebtData, UpdateDebtData } from '../shared/types/models';

interface DebtsState {
  debts: Debt[];
  isLoading: boolean;
  error: string | null;
  fetchDebts: () => Promise<void>;
  createDebt: (data: CreateDebtData) => Promise<void>;
  updateDebt: (id: string, data: UpdateDebtData) => Promise<void>;
  deleteDebt: (id: string) => Promise<void>;
}

export const useDebtsStore = create<DebtsState>((set) => ({
  debts: [],
  isLoading: false,
  error: null,

  fetchDebts: async () => {
    set({ isLoading: true, error: null });
    try {
      const debts = await window.electronAPI.debts.list();
      set({ debts, isLoading: false });
    } catch {
      set({ error: 'Failed to load debts', isLoading: false });
    }
  },

  createDebt: async (data) => {
    set({ error: null });
    try {
      const debt = await window.electronAPI.debts.create(data);
      set((state) => ({ debts: [debt, ...state.debts] }));
    } catch {
      set({ error: 'Failed to create debt' });
    }
  },

  updateDebt: async (id, data) => {
    set({ error: null });
    try {
      const updated = await window.electronAPI.debts.update(id, data);
      set((state) => ({
        debts: state.debts.map((d) => (d.id === id ? updated : d)),
      }));
    } catch {
      set({ error: 'Failed to update debt' });
    }
  },

  deleteDebt: async (id) => {
    set({ error: null });
    try {
      await window.electronAPI.debts.delete(id);
      set((state) => ({
        debts: state.debts.filter((d) => d.id !== id),
      }));
    } catch {
      set({ error: 'Failed to delete debt' });
    }
  },
}));
