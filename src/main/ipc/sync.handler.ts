import { ipcMain, dialog } from 'electron';
import { IPC_CHANNELS } from '../../shared/types/ipc-channels';
import type { AppDatabase } from '../database/connection';
import { getSyncService } from '../sync';

export function registerSyncHandlers(_db: AppDatabase) {
  ipcMain.handle(IPC_CHANNELS.SYNC_EXPORT, async (_event, folderPath: string) => {
    const service = getSyncService();
    if (!service) return { success: false, error: 'Sync service not initialised' };
    return service.exportSnapshot(folderPath);
  });

  ipcMain.handle(IPC_CHANNELS.SYNC_IMPORT, async (_event, folderPath: string) => {
    const service = getSyncService();
    if (!service) return { success: false, error: 'Sync service not initialised' };
    return service.importSnapshot(folderPath);
  });

  ipcMain.handle(IPC_CHANNELS.SYNC_CHECK, async (_event, folderPath: string) => {
    const service = getSyncService();
    if (!service) return { hasUpdates: false };
    return service.checkForUpdates(folderPath);
  });

  ipcMain.handle(IPC_CHANNELS.SYNC_PICK_FOLDER, async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory'],
      title: 'Choose Sync Folder',
    });
    if (result.canceled || result.filePaths.length === 0) return null;
    return result.filePaths[0];
  });
}
