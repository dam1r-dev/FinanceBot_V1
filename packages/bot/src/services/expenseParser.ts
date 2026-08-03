export type ParsedCurrency = "KZT" | "USD";

export interface ParsedExpense {
  amount: number;
  currency: ParsedCurrency;
  category: string;
}

const CURRENCY_ALIASES: Record<string, ParsedCurrency> = {
  usd: "USD",
  $: "USD",
  доллар: "USD",
  долларов: "USD",
  долл: "USD",
  kzt: "KZT",
  тенге: "KZT",
  "₸": "KZT",
  тг: "KZT",
};

const AMOUNT_RE = /(\d+(?:[.,]\d+)?)/;

/**
 * Парсит свободный текст траты: «кофе 1500», «1500 такси», «20 usd такси».
 * Сумма — первое число в тексте, валюта — опциональный алиас, всё
 * остальное — категория (создаётся на лету, без предопределённого списка).
 */
export function parseExpenseText(raw: string): ParsedExpense | null {
  const text = raw.trim();
  if (!text) return null;

  const amountMatch = text.match(AMOUNT_RE);
  if (!amountMatch) return null;

  const amount = Number(amountMatch[1].replace(",", "."));
  if (!Number.isFinite(amount) || amount <= 0) return null;

  const tokens = text
    .slice(0, amountMatch.index)
    .concat(" ", text.slice((amountMatch.index ?? 0) + amountMatch[0].length))
    .split(/\s+/)
    .filter(Boolean);

  let currency: ParsedCurrency = "KZT";
  const remaining: string[] = [];
  for (const token of tokens) {
    const key = token.toLowerCase();
    const alias = CURRENCY_ALIASES[key];
    if (alias) {
      currency = alias;
    } else {
      remaining.push(token);
    }
  }

  const category = remaining.join(" ").trim().toLowerCase() || "разное";

  return { amount, currency, category };
}
