import type { PrismaClient } from "@prisma/client";
import { prisma as defaultPrisma } from "./client";

type CurrencyCode = "USD" | "KZT";

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // раз в сутки

export async function getCachedRate(
  db: PrismaClient,
  base: string,
  quote: string
): Promise<number | null> {
  const row = await db.exchangeRate.findUnique({
    where: { base_quote: { base, quote } },
  });
  if (!row) return null;
  const age = Date.now() - row.fetchedAt.getTime();
  if (age > CACHE_TTL_MS) return null;
  return Number(row.rate);
}

export async function upsertRate(
  db: PrismaClient,
  base: string,
  quote: string,
  rate: number
): Promise<void> {
  await db.exchangeRate.upsert({
    where: { base_quote: { base, quote } },
    create: { base, quote, rate },
    update: { rate, fetchedAt: new Date() },
  });
}

async function fetchRate(base: string, quote: string): Promise<number> {
  // open.er-api.com: бесплатный курс без API-ключа (exchangerate.host с 2023
  // требует платный access_key, поэтому используется как дефолт вместо него).
  const apiUrl = process.env.FX_API_URL ?? "https://open.er-api.com/v6";
  const url = `${apiUrl}/latest/${base}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`FX API error: ${res.status}`);
  }
  const data = (await res.json()) as { result?: string; rates?: Record<string, number> };
  const rate = data.rates?.[quote];
  if (!rate) {
    throw new Error(`FX API response missing rate ${base}->${quote}`);
  }
  return rate;
}

/**
 * Курс: сколько `quote` за 1 `base`. Кэшируется в БД на сутки — общая
 * точка правды и для бота (packages/bot), и для Mini App (packages/miniapp).
 */
export async function getRate(
  base: CurrencyCode,
  quote: CurrencyCode,
  db: PrismaClient = defaultPrisma
): Promise<number> {
  if (base === quote) return 1;

  const cached = await getCachedRate(db, base, quote);
  if (cached !== null) return cached;

  const rate = await fetchRate(base, quote);
  await upsertRate(db, base, quote, rate);
  return rate;
}

export async function convert(
  amount: number,
  from: CurrencyCode,
  to: CurrencyCode,
  db: PrismaClient = defaultPrisma
): Promise<number> {
  if (from === to) return amount;
  const rate = await getRate(from, to, db);
  return amount * rate;
}
