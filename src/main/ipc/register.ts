import { ipcMain } from 'electron';
import { IPC_CHANNELS } from '../../shared/types/ipc-channels';
import type { AppDatabase } from '../database/connection';
import { registerAccountsHandlers } from './accounts.handler';
import { registerTransactionsHandlers } from './transactions.handler';
import { registerCategoriesHandlers } from './categories.handler';
import { registerBudgetsHandlers } from './budgets.handler';
import { registerRecurringHandlers } from './recurring.handler';
import { registerSettingsHandlers } from './settings.handler';
import { registerDashboardHandlers } from './dashboard.handler';
import { registerExchangeHandlers } from './exchange.handler';
import { registerExportHandlers } from './export.handler';
import { registerSavingsGoalsHandlers } from './savings-goals.handler';
import { registerDebtsHandlers } from './debts.handler';
import { registerAnalyticsHandlers } from './analytics.handler';
import { registerSyncHandlers } from './sync.handler';

export function registerAllHandlers(db: AppDatabase) {
  registerAccountsHandlers(db);
  registerTransactionsHandlers(db);
  registerCategoriesHandlers(db);
  registerBudgetsHandlers(db);
  registerRecurringHandlers(db);
  registerSettingsHandlers(db);
  registerDashboardHandlers(db);
  registerExchangeHandlers(db);
  registerExportHandlers(db);
  registerSavingsGoalsHandlers(db);
  registerDebtsHandlers(db);
  registerAnalyticsHandlers(db);
  registerSyncHandlers(db);

  // Platform info
  ipcMain.handle(IPC_CHANNELS.PLATFORM_INFO, async () => ({
    platform: process.platform,
    version: process.versions.electron,
    arch: process.arch,
  }));
}
