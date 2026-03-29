import { create } from 'zustand';
import type { SavingsGoal, CreateSavingsGoalData, UpdateSavingsGoalData } from '../shared/types/models';

interface SavingsGoalsState {
  goals: SavingsGoal[];
  isLoading: boolean;
  error: string | null;
  fetchGoals: () => Promise<void>;
  createGoal: (data: CreateSavingsGoalData) => Promise<void>;
  updateGoal: (id: string, data: UpdateSavingsGoalData) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
}

export const useSavingsGoalsStore = create<SavingsGoalsState>((set) => ({
  goals: [],
  isLoading: false,
  error: null,

  fetchGoals: async () => {
    set({ isLoading: true, error: null });
    try {
      const goals = await window.electronAPI.savingsGoals.list();
      set({ goals, isLoading: false });
    } catch {
      set({ error: 'Failed to load savings goals', isLoading: false });
    }
  },

  createGoal: async (data) => {
    set({ error: null });
    try {
      const goal = await window.electronAPI.savingsGoals.create(data);
      set((state) => ({ goals: [goal, ...state.goals] }));
    } catch {
      set({ error: 'Failed to create savings goal' });
    }
  },

  updateGoal: async (id, data) => {
    set({ error: null });
    try {
      const updated = await window.electronAPI.savingsGoals.update(id, data);
      set((state) => ({
        goals: state.goals.map((g) => (g.id === id ? updated : g)),
      }));
    } catch {
      set({ error: 'Failed to update savings goal' });
    }
  },

  deleteGoal: async (id) => {
    set({ error: null });
    try {
      await window.electronAPI.savingsGoals.delete(id);
      set((state) => ({
        goals: state.goals.filter((g) => g.id !== id),
      }));
    } catch {
      set({ error: 'Failed to delete savings goal' });
    }
  },
}));
