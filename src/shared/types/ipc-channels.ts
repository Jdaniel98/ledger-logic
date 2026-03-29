/* IPC channel name constants.
   Prevents typos and provides a single reference for all channel names. */

export const IPC_CHANNELS = {
  // Accounts
  ACCOUNTS_LIST: 'accounts:list',
  ACCOUNTS_CREATE: 'accounts:create',
  ACCOUNTS_UPDATE: 'accounts:update',
  ACCOUNTS_DELETE: 'accounts:delete',

  // Transactions
  TRANSACTIONS_LIST: 'transactions:list',
  TRANSACTIONS_CREATE: 'transactions:create',
  TRANSACTIONS_UPDATE: 'transactions:update',
  TRANSACTIONS_DELETE: 'transactions:delete',

  // Categories
  CATEGORIES_LIST: 'categories:list',
  CATEGORIES_CREATE: 'categories:create',
  CATEGORIES_UPDATE: 'categories:update',
  CATEGORIES_DELETE: 'categories:delete',

  // Budgets
  BUDGETS_LIST: 'budgets:list',
  BUDGETS_GET: 'budgets:get',
  BUDGETS_CREATE: 'budgets:create',
  BUDGETS_UPDATE: 'budgets:update',
  BUDGETS_DELETE: 'budgets:delete',
  BUDGETS_GET_ROLLOVER: 'budgets:get-rollover',

  // Budget Lines
  BUDGET_LINES_UPDATE: 'budget-lines:update',
  BUDGET_LINES_DELETE: 'budget-lines:delete',

  // Recurring Templates
  RECURRING_LIST: 'recurring:list',
  RECURRING_CREATE: 'recurring:create',
  RECURRING_UPDATE: 'recurring:update',
  RECURRING_DELETE: 'recurring:delete',
  RECURRING_GENERATE: 'recurring:generate',

  // Settings
  SETTINGS_GET: 'settings:get',
  SETTINGS_SET: 'settings:set',

  // Dashboard
  DASHBOARD_SUMMARY: 'dashboard:summary',

  // Export
  EXPORT_TRANSACTIONS_CSV: 'export:transactions-csv',

  // Exchange Rates
  EXCHANGE_RATES_GET: 'exchange:rates-get',
  EXCHANGE_RATES_REFRESH: 'exchange:rates-refresh',
  EXCHANGE_RATE_CONVERT: 'exchange:convert',

  // Savings Goals
  SAVINGS_GOALS_LIST: 'savings-goals:list',
  SAVINGS_GOALS_CREATE: 'savings-goals:create',
  SAVINGS_GOALS_UPDATE: 'savings-goals:update',
  SAVINGS_GOALS_DELETE: 'savings-goals:delete',

  // Debts
  DEBTS_LIST: 'debts:list',
  DEBTS_CREATE: 'debts:create',
  DEBTS_UPDATE: 'debts:update',
  DEBTS_DELETE: 'debts:delete',

  // Analytics
  ANALYTICS_SPENDING_TRENDS: 'analytics:spending-trends',
  ANALYTICS_CATEGORY_BREAKDOWN: 'analytics:category-breakdown',
  ANALYTICS_NET_WORTH: 'analytics:net-worth',
  ANALYTICS_DAILY_SPENDING: 'analytics:daily-spending',

  // Receipts
  TRANSACTIONS_ATTACH_RECEIPT: 'transactions:attach-receipt',
  TRANSACTIONS_OPEN_RECEIPT: 'transactions:open-receipt',
  DIALOG_OPEN_FILE: 'dialog:open-file',

  // Sync
  SYNC_EXPORT: 'sync:export',
  SYNC_IMPORT: 'sync:import',
  SYNC_CHECK: 'sync:check',
  SYNC_PICK_FOLDER: 'sync:pick-folder',

  // Notifications
  NOTIFICATION_NAVIGATE: 'notification:navigate',

  // Platform
  PLATFORM_INFO: 'platform:info',
} as const;

export type IPCChannel = (typeof IPC_CHANNELS)[keyof typeof IPC_CHANNELS];
