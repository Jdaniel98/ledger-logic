import { create } from 'zustand';

interface SettingsState {
  settings: Record<string, string>;
  isLoading: boolean;
  error: string | null;
  fetchSettings: () => Promise<void>;
  fetchSetting: (key: string) => Promise<string | null>;
  setSetting: (key: string, value: string) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: {},
  isLoading: false,
  error: null,

  fetchSettings: async () => {
    set({ isLoading: true });
    try {
      const keys = ['theme', 'baseCurrency'];
      const loaded: Record<string, string> = {};
      for (const key of keys) {
        const value = await window.electronAPI.settings.get(key);
        if (value !== null) loaded[key] = value;
      }
      set((state) => ({
        settings: { ...state.settings, ...loaded },
        isLoading: false,
      }));
    } catch {
      set({ error: 'Failed to load settings', isLoading: false });
    }
  },

  fetchSetting: async (key) => {
    try {
      const value = await window.electronAPI.settings.get(key);
      if (value !== null) {
        set((state) => ({
          settings: { ...state.settings, [key]: value },
        }));
      }
      return value;
    } catch {
      set({ error: `Failed to load setting: ${key}` });
      return null;
    }
  },

  setSetting: async (key, value) => {
    set({ error: null });
    try {
      await window.electronAPI.settings.set(key, value);
      set((state) => ({
        settings: { ...state.settings, [key]: value },
      }));
    } catch {
      set({ error: `Failed to save setting: ${key}` });
    }
  },
}));
