import { v4 as uuid } from 'uuid';
import { eq } from 'drizzle-orm';
import type { AppDatabase } from './connection';
import { categories, settings } from './schema';

const DEFAULT_CATEGORIES = [
  // Expense categories
  { name: 'Housing', icon: 'House', type: 'expense' as const, color: '#50616e' },
  { name: 'Groceries', icon: 'ShoppingCart', type: 'expense' as const, color: '#15803d' },
  { name: 'Dining & Bars', icon: 'ForkKnife', type: 'expense' as const, color: '#9f403d' },
  { name: 'Transport', icon: 'Car', type: 'expense' as const, color: '#b45309' },
  { name: 'Utilities', icon: 'Lightning', type: 'expense' as const, color: '#0369a1' },
  { name: 'Entertainment', icon: 'FilmSlate', type: 'expense' as const, color: '#7c3aed' },
  { name: 'Health', icon: 'Heartbeat', type: 'expense' as const, color: '#dc2626' },
  { name: 'Shopping', icon: 'Bag', type: 'expense' as const, color: '#d97706' },
  { name: 'Subscriptions', icon: 'Repeat', type: 'expense' as const, color: '#5d5c78' },
  { name: 'Education', icon: 'GraduationCap', type: 'expense' as const, color: '#2563eb' },
  { name: 'Personal Care', icon: 'User', type: 'expense' as const, color: '#db2777' },
  { name: 'Insurance', icon: 'Shield', type: 'expense' as const, color: '#4f46e5' },
  // Income categories
  { name: 'Salary', icon: 'Money', type: 'income' as const, color: '#005bc1' },
  { name: 'Freelance', icon: 'Briefcase', type: 'income' as const, color: '#0891b2' },
  { name: 'Investments', icon: 'ChartLineUp', type: 'income' as const, color: '#059669' },
  { name: 'Other Income', icon: 'Plus', type: 'income' as const, color: '#6366f1' },
];

export function seedDatabase(db: AppDatabase) {
  // Only seed if categories table is empty
  const existingCategories = db.select().from(categories).all();
  if (existingCategories.length > 0) return;

  const now = Date.now();

  for (let i = 0; i < DEFAULT_CATEGORIES.length; i++) {
    const cat = DEFAULT_CATEGORIES[i];
    db.insert(categories).values({
      id: uuid(),
      name: cat.name,
      icon: cat.icon,
      color: cat.color,
      parentId: null,
      type: cat.type,
      isSystem: 1,
      sortOrder: i,
      createdAt: now,
      updatedAt: now,
      syncVersion: 0,
    }).run();
  }

  // Default settings
  const existingSettings = db.select().from(settings).where(eq(settings.key, 'currency')).all();
  if (existingSettings.length === 0) {
    db.insert(settings).values({
      id: uuid(),
      key: 'currency',
      value: 'GBP',
      createdAt: now,
      updatedAt: now,
    }).run();

    db.insert(settings).values({
      id: uuid(),
      key: 'theme',
      value: 'light',
      createdAt: now,
      updatedAt: now,
    }).run();
  }
}
