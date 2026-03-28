import { eq } from 'drizzle-orm';
import { v4 as uuid } from 'uuid';
import type { AppDatabase } from '../database/connection';
import { settings } from '../database/schema';
import { net } from 'electron';

export const SUPPORTED_CURRENCIES = [
  'GBP', 'USD', 'EUR', 'CAD', 'AUD', 'JPY', 'CHF', 'NGN',
] as const;

export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

interface ExchangeRateCache {
  base: string;
  rates: Record<string, number>;
  fetchedAt: number;
}

const CACHE_KEY = 'exchangeRates';
const CACHE_TTL_MS = 4 * 60 * 60 * 1000; // 4 hours

function readCache(db: AppDatabase): ExchangeRateCache | null {
  const row = db.select().from(settings).where(eq(settings.key, CACHE_KEY)).get();
  if (!row) return null;
  try {
    return JSON.parse(row.value) as ExchangeRateCache;
  } catch {
    return null;
  }
}

function writeCache(db: AppDatabase, cache: ExchangeRateCache): void {
  const now = Date.now();
  const existing = db.select().from(settings).where(eq(settings.key, CACHE_KEY)).get();
  const value = JSON.stringify(cache);

  if (existing) {
    db.update(settings)
      .set({ value, updatedAt: now })
      .where(eq(settings.key, CACHE_KEY))
      .run();
  } else {
    db.insert(settings)
      .values({ id: uuid(), key: CACHE_KEY, value, createdAt: now, updatedAt: now })
      .run();
  }
}

async function fetchFromAPI(base: string): Promise<Record<string, number>> {
  return new Promise((resolve, reject) => {
    const request = net.request(`https://api.frankfurter.dev/v1/latest?base=${base}`);

    let body = '';
    request.on('response', (response) => {
      response.on('data', (chunk) => {
        body += chunk.toString();
      });
      response.on('end', () => {
        try {
          const data = JSON.parse(body);
          if (data.rates) {
            resolve(data.rates as Record<string, number>);
          } else {
            reject(new Error('Invalid response: no rates field'));
          }
        } catch (err) {
          reject(err);
        }
      });
    });

    request.on('error', reject);
    request.end();
  });
}

export async function fetchLatestRates(
  db: AppDatabase,
  base: string,
  force = false,
): Promise<Record<string, number>> {
  const cached = readCache(db);

  if (!force && cached && cached.base === base && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.rates;
  }

  try {
    const rates = await fetchFromAPI(base);
    const cache: ExchangeRateCache = { base, rates, fetchedAt: Date.now() };
    writeCache(db, cache);
    return rates;
  } catch (err) {
    console.warn('Exchange rate fetch failed, using cached rates:', err);
    if (cached && cached.base === base) {
      return cached.rates;
    }
    // No cache available — return identity rates as fallback
    console.warn('No cached rates available, returning 1.0 for all currencies');
    return {};
  }
}

export async function getExchangeRate(
  db: AppDatabase,
  from: string,
  to: string,
): Promise<number> {
  if (from === to) return 1;

  const rates = await fetchLatestRates(db, from);
  const rate = rates[to];

  if (rate !== undefined) return rate;

  // Try inverse: fetch rates based on `to` and invert
  const inverseRates = await fetchLatestRates(db, to);
  const inverseRate = inverseRates[from];
  if (inverseRate !== undefined && inverseRate !== 0) return 1 / inverseRate;

  console.warn(`No exchange rate found for ${from} → ${to}, returning 1.0`);
  return 1;
}
