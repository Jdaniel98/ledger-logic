import { ipcMain } from 'electron';
import { eq } from 'drizzle-orm';
import { v4 as uuid } from 'uuid';
import { IPC_CHANNELS } from '../../shared/types/ipc-channels';
import type { AppDatabase } from '../database/connection';
import { accounts } from '../database/schema';
import type { Account, CreateAccountData, UpdateAccountData } from '../../shared/types/models';

function toAccountDTO(row: typeof accounts.$inferSelect): Account {
  return {
    id: row.id,
    name: row.name,
    type: row.type as Account['type'],
    currency: row.currency,
    balance: row.balance,
    icon: row.icon,
    color: row.color,
    isArchived: row.isArchived === 1,
    sortOrder: row.sortOrder,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function registerAccountsHandlers(db: AppDatabase) {
  ipcMain.handle(IPC_CHANNELS.ACCOUNTS_LIST, async () => {
    const rows = db.select().from(accounts).all();
    return rows.map(toAccountDTO);
  });

  ipcMain.handle(IPC_CHANNELS.ACCOUNTS_CREATE, async (_event, data: CreateAccountData) => {
    const now = Date.now();
    const id = uuid();

    db.insert(accounts).values({
      id,
      name: data.name,
      type: data.type,
      currency: data.currency ?? 'GBP',
      balance: data.balance ?? 0,
      icon: data.icon ?? null,
      color: data.color ?? null,
      isArchived: 0,
      sortOrder: 0,
      createdAt: now,
      updatedAt: now,
      syncVersion: 0,
    }).run();

    const row = db.select().from(accounts).where(eq(accounts.id, id)).get();
    if (!row) throw new Error('Failed to create account');
    return toAccountDTO(row);
  });

  ipcMain.handle(IPC_CHANNELS.ACCOUNTS_UPDATE, async (_event, id: string, data: UpdateAccountData) => {
    const now = Date.now();

    const updateValues: Record<string, unknown> = { updatedAt: now };
    if (data.name !== undefined) updateValues.name = data.name;
    if (data.type !== undefined) updateValues.type = data.type;
    if (data.currency !== undefined) updateValues.currency = data.currency;
    if (data.balance !== undefined) updateValues.balance = data.balance;
    if (data.icon !== undefined) updateValues.icon = data.icon;
    if (data.color !== undefined) updateValues.color = data.color;
    if (data.isArchived !== undefined) updateValues.isArchived = data.isArchived ? 1 : 0;
    if (data.sortOrder !== undefined) updateValues.sortOrder = data.sortOrder;

    db.update(accounts).set(updateValues).where(eq(accounts.id, id)).run();

    const row = db.select().from(accounts).where(eq(accounts.id, id)).get();
    if (!row) throw new Error('Account not found');
    return toAccountDTO(row);
  });

  ipcMain.handle(IPC_CHANNELS.ACCOUNTS_DELETE, async (_event, id: string) => {
    // Soft delete — mark as archived
    db.update(accounts)
      .set({ isArchived: 1, updatedAt: Date.now() })
      .where(eq(accounts.id, id))
      .run();
  });
}
