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

  // Platform
  PLATFORM_INFO: 'platform:info',
} as const;

export type IPCChannel = (typeof IPC_CHANNELS)[keyof typeof IPC_CHANNELS];
