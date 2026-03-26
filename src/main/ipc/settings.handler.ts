import { ipcMain } from 'electron';
import { eq } from 'drizzle-orm';
import { v4 as uuid } from 'uuid';
import { IPC_CHANNELS } from '../../shared/types/ipc-channels';
import type { AppDatabase } from '../database/connection';
import { settings } from '../database/schema';

export function registerSettingsHandlers(db: AppDatabase) {
  ipcMain.handle(IPC_CHANNELS.SETTINGS_GET, async (_event, key: string) => {
    const row = db.select().from(settings).where(eq(settings.key, key)).get();
    return row?.value ?? null;
  });

  ipcMain.handle(IPC_CHANNELS.SETTINGS_SET, async (_event, key: string, value: string) => {
    const now = Date.now();
    const existing = db.select().from(settings).where(eq(settings.key, key)).get();

    if (existing) {
      db.update(settings)
        .set({ value, updatedAt: now })
        .where(eq(settings.key, key))
        .run();
    } else {
      db.insert(settings)
        .values({
          id: uuid(),
          key,
          value,
          createdAt: now,
          updatedAt: now,
        })
        .run();
    }
  });
}
