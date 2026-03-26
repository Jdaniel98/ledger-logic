import { create } from 'zustand';
import type {
  RecurringTemplate,
  CreateRecurringTemplateData,
  UpdateRecurringTemplateData,
} from '../shared/types/models';

interface RecurringState {
  templates: RecurringTemplate[];
  isLoading: boolean;
  error: string | null;
  fetchTemplates: () => Promise<void>;
  createTemplate: (data: CreateRecurringTemplateData) => Promise<void>;
  updateTemplate: (id: string, data: UpdateRecurringTemplateData) => Promise<void>;
  deleteTemplate: (id: string) => Promise<void>;
  generateDue: () => Promise<number>;
}

export const useRecurringStore = create<RecurringState>((set) => ({
  templates: [],
  isLoading: false,
  error: null,

  fetchTemplates: async () => {
    set({ isLoading: true, error: null });
    try {
      const templates = await window.electronAPI.recurring.list();
      set({ templates, isLoading: false });
    } catch {
      set({ error: 'Failed to load recurring templates', isLoading: false });
    }
  },

  createTemplate: async (data) => {
    set({ error: null });
    try {
      const template = await window.electronAPI.recurring.create(data);
      set((state) => ({ templates: [...state.templates, template] }));
    } catch {
      set({ error: 'Failed to create recurring template' });
    }
  },

  updateTemplate: async (id, data) => {
    set({ error: null });
    try {
      const updated = await window.electronAPI.recurring.update(id, data);
      set((state) => ({
        templates: state.templates.map((t) => (t.id === id ? updated : t)),
      }));
    } catch {
      set({ error: 'Failed to update recurring template' });
    }
  },

  deleteTemplate: async (id) => {
    set({ error: null });
    try {
      await window.electronAPI.recurring.delete(id);
      set((state) => ({
        templates: state.templates.filter((t) => t.id !== id),
      }));
    } catch {
      set({ error: 'Failed to delete recurring template' });
    }
  },

  generateDue: async () => {
    try {
      return await window.electronAPI.recurring.generate();
    } catch {
      set({ error: 'Failed to generate recurring transactions' });
      return 0;
    }
  },
}));
