import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

export const accounts = sqliteTable('accounts', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  type: text('type').notNull(), // checking | savings | credit | cash | investment
  currency: text('currency').notNull().default('GBP'),
  balance: real('balance').notNull().default(0),
  icon: text('icon'),
  color: text('color'),
  isArchived: integer('is_archived').notNull().default(0),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
  syncVersion: integer('sync_version').notNull().default(0),
});

export const categories = sqliteTable('categories', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  icon: text('icon'),
  color: text('color'),
  parentId: text('parent_id'),
  type: text('type').notNull().default('expense'), // expense | income
  isSystem: integer('is_system').notNull().default(0),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
  syncVersion: integer('sync_version').notNull().default(0),
});

export const transactions = sqliteTable('transactions', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull().references(() => accounts.id),
  categoryId: text('category_id').references(() => categories.id),
  amount: real('amount').notNull(),
  type: text('type').notNull(), // income | expense | transfer
  description: text('description'),
  payee: text('payee'),
  date: text('date').notNull(), // ISO 8601 date
  notes: text('notes'),
  tags: text('tags'), // JSON string array e.g. '["groceries","costco"]'
  currency: text('currency'), // transaction-level currency (null = account currency)
  baseAmount: real('base_amount'), // amount converted to user's base currency
  receiptPath: text('receipt_path'), // local filesystem path
  isRecurring: integer('is_recurring').notNull().default(0),
  recurringTemplateId: text('recurring_template_id'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
  syncVersion: integer('sync_version').notNull().default(0),
});

export const budgets = sqliteTable('budgets', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  month: text('month'), // 'YYYY-MM' format, primary lookup key
  periodType: text('period_type').notNull().default('monthly'), // monthly | weekly | yearly
  startDate: text('start_date').notNull(),
  amount: real('amount').notNull(),
  isActive: integer('is_active').notNull().default(1),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
  syncVersion: integer('sync_version').notNull().default(0),
});

export const budgetLines = sqliteTable('budget_lines', {
  id: text('id').primaryKey(),
  budgetId: text('budget_id').notNull().references(() => budgets.id),
  categoryId: text('category_id').notNull().references(() => categories.id),
  amount: real('amount').notNull(),
  rolloverEnabled: integer('rollover_enabled').notNull().default(0),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
  syncVersion: integer('sync_version').notNull().default(0),
});

export const recurringTemplates = sqliteTable('recurring_templates', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull().references(() => accounts.id),
  categoryId: text('category_id').references(() => categories.id),
  amount: real('amount').notNull(),
  type: text('type').notNull(), // income | expense
  description: text('description'),
  payee: text('payee'),
  amountType: text('amount_type').notNull().default('fixed'), // fixed | estimated | variable
  frequency: text('frequency').notNull(), // daily | weekly | biweekly | monthly | yearly
  startDate: text('start_date').notNull(),
  endDate: text('end_date'),
  nextDueDate: text('next_due_date'),
  isActive: integer('is_active').notNull().default(1),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
  syncVersion: integer('sync_version').notNull().default(0),
});

export const savingsGoals = sqliteTable('savings_goals', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  targetAmount: real('target_amount').notNull(),
  currentAmount: real('current_amount').notNull().default(0),
  targetDate: text('target_date'),
  accountId: text('account_id').references(() => accounts.id),
  icon: text('icon'),
  color: text('color'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
  syncVersion: integer('sync_version').notNull().default(0),
});

export const debts = sqliteTable('debts', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  type: text('type').notNull(), // loan | credit_card | mortgage | other
  principal: real('principal').notNull(),
  balance: real('balance').notNull(),
  interestRate: real('interest_rate').notNull(),
  minimumPayment: real('minimum_payment').notNull(),
  dueDate: text('due_date'),
  accountId: text('account_id').references(() => accounts.id),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
  syncVersion: integer('sync_version').notNull().default(0),
});

export const syncQueue = sqliteTable('sync_queue', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  tableName: text('table_name').notNull(),
  recordId: text('record_id').notNull(),
  operation: text('operation').notNull(), // insert | update | delete
  payload: text('payload').notNull(), // JSON blob
  status: text('status').notNull().default('pending'), // pending | synced | failed
  createdAt: integer('created_at').notNull(),
});

export const settings = sqliteTable('settings', {
  id: text('id').primaryKey(),
  key: text('key').notNull().unique(),
  value: text('value').notNull(),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
});
