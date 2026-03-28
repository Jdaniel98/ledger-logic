import { ipcMain } from 'electron';
import { IPC_CHANNELS } from '../../shared/types/ipc-channels';
import type { AppDatabase } from '../database/connection';
import { fetchLatestRates, getExchangeRate } from '../services/exchange-rates';

export function registerExchangeHandlers(db: AppDatabase) {
  ipcMain.handle(IPC_CHANNELS.EXCHANGE_RATES_GET, async (_event, base: string) => {
    return fetchLatestRates(db, base);
  });

  ipcMain.handle(IPC_CHANNELS.EXCHANGE_RATES_REFRESH, async (_event, base: string) => {
    return fetchLatestRates(db, base, true);
  });

  ipcMain.handle(
    IPC_CHANNELS.EXCHANGE_RATE_CONVERT,
    async (_event, from: string, to: string, amount: number) => {
      const rate = await getExchangeRate(db, from, to);
      return { rate, converted: amount * rate };
    },
  );
}
