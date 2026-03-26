import { ipcMain } from 'electron';
import { eq } from 'drizzle-orm';
import { v4 as uuid } from 'uuid';
import { IPC_CHANNELS } from '../../shared/types/ipc-channels';
import type { AppDatabase } from '../database/connection';
import { categories } from '../database/schema';
import type { Category, CreateCategoryData, UpdateCategoryData } from '../../shared/types/models';

function toCategoryDTO(row: typeof categories.$inferSelect): Category {
  return {
    id: row.id,
    name: row.name,
    icon: row.icon,
    color: row.color,
    parentId: row.parentId,
    type: row.type as Category['type'],
    isSystem: row.isSystem === 1,
    sortOrder: row.sortOrder,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function registerCategoriesHandlers(db: AppDatabase) {
  ipcMain.handle(IPC_CHANNELS.CATEGORIES_LIST, async () => {
    const rows = db.select().from(categories).all();
    return rows.map(toCategoryDTO);
  });

  ipcMain.handle(
    IPC_CHANNELS.CATEGORIES_CREATE,
    async (_event, data: CreateCategoryData) => {
      const now = Date.now();
      const id = uuid();

      db.insert(categories)
        .values({
          id,
          name: data.name,
          type: data.type,
          icon: data.icon ?? null,
          color: data.color ?? null,
          parentId: data.parentId ?? null,
          isSystem: 0,
          sortOrder: 0,
          createdAt: now,
          updatedAt: now,
          syncVersion: 0,
        })
        .run();

      const row = db.select().from(categories).where(eq(categories.id, id)).get();
      if (!row) throw new Error('Failed to create category');
      return toCategoryDTO(row);
    },
  );

  ipcMain.handle(
    IPC_CHANNELS.CATEGORIES_UPDATE,
    async (_event, id: string, data: UpdateCategoryData) => {
      const existing = db.select().from(categories).where(eq(categories.id, id)).get();
      if (!existing) throw new Error('Category not found');

      const now = Date.now();
      const updateValues: Record<string, unknown> = { updatedAt: now };

      if (data.name !== undefined) updateValues.name = data.name;
      if (data.type !== undefined) updateValues.type = data.type;
      if (data.icon !== undefined) updateValues.icon = data.icon;
      if (data.color !== undefined) updateValues.color = data.color;
      if (data.parentId !== undefined) updateValues.parentId = data.parentId;
      if (data.sortOrder !== undefined) updateValues.sortOrder = data.sortOrder;

      db.update(categories).set(updateValues).where(eq(categories.id, id)).run();

      const row = db.select().from(categories).where(eq(categories.id, id)).get();
      if (!row) throw new Error('Category not found');
      return toCategoryDTO(row);
    },
  );

  ipcMain.handle(IPC_CHANNELS.CATEGORIES_DELETE, async (_event, id: string) => {
    const existing = db.select().from(categories).where(eq(categories.id, id)).get();
    if (!existing) throw new Error('Category not found');
    if (existing.isSystem === 1) throw new Error('Cannot delete system category');

    db.delete(categories).where(eq(categories.id, id)).run();
  });
}
