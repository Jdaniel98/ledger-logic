import { create } from 'zustand';
import type {
  Category,
  CategoryTreeNode,
  CreateCategoryData,
  UpdateCategoryData,
} from '../shared/types/models';

function buildTree(categories: Category[]): CategoryTreeNode[] {
  const map = new Map<string, CategoryTreeNode>();
  const roots: CategoryTreeNode[] = [];

  // Create tree nodes
  for (const cat of categories) {
    map.set(cat.id, { ...cat, children: [] });
  }

  // Build tree structure
  for (const cat of categories) {
    const node = map.get(cat.id)!;
    if (cat.parentId && map.has(cat.parentId)) {
      map.get(cat.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}

interface CategoriesState {
  categories: Category[];
  categoryTree: CategoryTreeNode[];
  isLoading: boolean;
  error: string | null;
  fetchCategories: () => Promise<void>;
  createCategory: (data: CreateCategoryData) => Promise<void>;
  updateCategory: (id: string, data: UpdateCategoryData) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
}

export const useCategoriesStore = create<CategoriesState>((set) => ({
  categories: [],
  categoryTree: [],
  isLoading: false,
  error: null,

  fetchCategories: async () => {
    set({ isLoading: true, error: null });
    try {
      const categories = await window.electronAPI.categories.list();
      set({
        categories,
        categoryTree: buildTree(categories),
        isLoading: false,
      });
    } catch {
      set({ error: 'Failed to load categories', isLoading: false });
    }
  },

  createCategory: async (data) => {
    set({ error: null });
    try {
      const category = await window.electronAPI.categories.create(data);
      set((state) => {
        const categories = [...state.categories, category];
        return { categories, categoryTree: buildTree(categories) };
      });
    } catch {
      set({ error: 'Failed to create category' });
    }
  },

  updateCategory: async (id, data) => {
    set({ error: null });
    try {
      const updated = await window.electronAPI.categories.update(id, data);
      set((state) => {
        const categories = state.categories.map((c) => (c.id === id ? updated : c));
        return { categories, categoryTree: buildTree(categories) };
      });
    } catch {
      set({ error: 'Failed to update category' });
    }
  },

  deleteCategory: async (id) => {
    set({ error: null });
    try {
      await window.electronAPI.categories.delete(id);
      set((state) => {
        const categories = state.categories.filter((c) => c.id !== id);
        return { categories, categoryTree: buildTree(categories) };
      });
    } catch {
      set({ error: 'Failed to delete category' });
    }
  },
}));
