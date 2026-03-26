import { create } from 'zustand';
import type { DashboardSummary } from '../shared/types/models';

interface DashboardState {
  summary: DashboardSummary | null;
  currentMonth: string;
  isLoading: boolean;
  error: string | null;
  fetchSummary: (month?: string) => Promise<void>;
  setCurrentMonth: (month: string) => void;
}

function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  summary: null,
  currentMonth: getCurrentMonth(),
  isLoading: false,
  error: null,

  fetchSummary: async (month) => {
    const targetMonth = month ?? get().currentMonth;
    set({ isLoading: true, error: null, currentMonth: targetMonth });
    try {
      const summary = await window.electronAPI.dashboard.summary(targetMonth);
      set({ summary, isLoading: false });
    } catch {
      set({ error: 'Failed to load dashboard', isLoading: false });
    }
  },

  setCurrentMonth: (month) => {
    set({ currentMonth: month });
    get().fetchSummary(month);
  },
}));
