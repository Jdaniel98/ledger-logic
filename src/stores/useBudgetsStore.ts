import { create } from 'zustand';
import type {
  Budget,
  BudgetWithLines,
  CreateBudgetData,
} from '../shared/types/models';

interface BudgetsState {
  budgets: Budget[];
  activeBudget: BudgetWithLines | null;
  currentMonth: string;
  isLoading: boolean;
  error: string | null;
  fetchBudgetForMonth: (month: string) => Promise<void>;
  createBudget: (data: CreateBudgetData) => Promise<void>;
  updateBudget: (id: string, data: Partial<CreateBudgetData>) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;
  setCurrentMonth: (month: string) => void;
}

function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export const useBudgetsStore = create<BudgetsState>((set, get) => ({
  budgets: [],
  activeBudget: null,
  currentMonth: getCurrentMonth(),
  isLoading: false,
  error: null,

  fetchBudgetForMonth: async (month) => {
    set({ isLoading: true, error: null, currentMonth: month });
    try {
      const budget = await window.electronAPI.budgets.get(month);
      set({ activeBudget: budget, isLoading: false });
    } catch {
      set({ error: 'Failed to load budget', isLoading: false });
    }
  },

  createBudget: async (data) => {
    set({ error: null });
    try {
      const budget = await window.electronAPI.budgets.create(data);
      set({ activeBudget: budget });
    } catch {
      set({ error: 'Failed to create budget' });
    }
  },

  updateBudget: async (id, data) => {
    set({ error: null });
    try {
      const budget = await window.electronAPI.budgets.update(id, data);
      set({ activeBudget: budget });
    } catch {
      set({ error: 'Failed to update budget' });
    }
  },

  deleteBudget: async (id) => {
    set({ error: null });
    try {
      await window.electronAPI.budgets.delete(id);
      set({ activeBudget: null });
    } catch {
      set({ error: 'Failed to delete budget' });
    }
  },

  setCurrentMonth: (month) => {
    set({ currentMonth: month });
    get().fetchBudgetForMonth(month);
  },
}));
