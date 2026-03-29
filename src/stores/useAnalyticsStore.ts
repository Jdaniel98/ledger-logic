import { create } from 'zustand';
import type { SpendingTrend, CategoryBreakdownItem } from '../shared/types/models';

interface AnalyticsState {
  trends: SpendingTrend[];
  categoryBreakdown: CategoryBreakdownItem[];
  isLoading: boolean;
  error: string | null;
  fetchTrends: (months?: number) => Promise<void>;
  fetchCategoryBreakdown: (month: string) => Promise<void>;
}

export const useAnalyticsStore = create<AnalyticsState>((set) => ({
  trends: [],
  categoryBreakdown: [],
  isLoading: false,
  error: null,

  fetchTrends: async (months) => {
    set({ isLoading: true, error: null });
    try {
      const trends = await window.electronAPI.analytics.spendingTrends(months);
      set({ trends, isLoading: false });
    } catch {
      set({ error: 'Failed to load spending trends', isLoading: false });
    }
  },

  fetchCategoryBreakdown: async (month) => {
    set({ error: null });
    try {
      const categoryBreakdown = await window.electronAPI.analytics.categoryBreakdown(month);
      set({ categoryBreakdown });
    } catch {
      set({ error: 'Failed to load category breakdown' });
    }
  },
}));
