import { ipcMain } from 'electron';
import { IPC_CHANNELS } from '../../shared/types/ipc-channels';
import type { AppDatabase } from '../database/connection';
import { registerAccountsHandlers } from './accounts.handler';

export function registerAllHandlers(db: AppDatabase) {
  registerAccountsHandlers(db);

  // Platform info
  ipcMain.handle(IPC_CHANNELS.PLATFORM_INFO, async () => ({
    platform: process.platform,
    version: process.versions.electron,
    arch: process.arch,
  }));
}
