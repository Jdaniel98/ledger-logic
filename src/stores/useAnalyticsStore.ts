import { create } from 'zustand';
import type { SpendingTrend, CategoryBreakdownItem, NetWorthPoint, DailySpending } from '../shared/types/models';

interface AnalyticsState {
  trends: SpendingTrend[];
  categoryBreakdown: CategoryBreakdownItem[];
  netWorth: NetWorthPoint[];
  dailySpending: DailySpending[];
  isLoading: boolean;
  error: string | null;
  fetchTrends: (months?: number) => Promise<void>;
  fetchCategoryBreakdown: (month: string) => Promise<void>;
  fetchNetWorth: (months?: number) => Promise<void>;
  fetchDailySpending: (month: string) => Promise<void>;
}

export const useAnalyticsStore = create<AnalyticsState>((set) => ({
  trends: [],
  categoryBreakdown: [],
  netWorth: [],
  dailySpending: [],
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

  fetchNetWorth: async (months) => {
    set({ error: null });
    try {
      const netWorth = await window.electronAPI.analytics.netWorth(months);
      set({ netWorth });
    } catch {
      set({ error: 'Failed to load net worth data' });
    }
  },

  fetchDailySpending: async (month) => {
    set({ error: null });
    try {
      const dailySpending = await window.electronAPI.analytics.dailySpending(month);
      set({ dailySpending });
    } catch {
      set({ error: 'Failed to load daily spending' });
    }
  },
}));
