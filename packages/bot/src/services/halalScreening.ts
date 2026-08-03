export type HalalStatus = "HALAL" | "HARAM" | "DOUBTFUL" | "UNSCREENED";

export interface ScreeningInput {
  ticker: string;
  sector?: string;
  debtToMarketCapPct?: number;
  interestCashToMarketCapPct?: number;
  haramRevenuePct?: number;
}

export interface ScreeningResult {
  status: HalalStatus;
  reasons: string[];
}

const HARAM_SECTOR_KEYWORDS = [
  "alcohol",
  "алкоголь",
  "gambling",
  "казино",
  "bank",
  "банк",
  "insurance",
  "страхован",
  "pork",
  "свинин",
  "tobacco",
  "табак",
  "weapon",
  "оружи",
  "adult",
  "порно",
];

// Упрощённая методология в духе AAOIFI/S&P Shariah screening.
// TODO: подключить реальный источник финансовых данных по эмитентам
// (financialmodelingprep.com, Alpha Vantage) — сейчас показатели передаются вручную.
const DEBT_THRESHOLD_PCT = 33;
const CASH_THRESHOLD_PCT = 33;
const HARAM_REVENUE_THRESHOLD_PCT = 5;

export function screenInvestment(input: ScreeningInput): ScreeningResult {
  if (input.sector) {
    const sectorLower = input.sector.toLowerCase();
    const isHaramSector = HARAM_SECTOR_KEYWORDS.some((kw) => sectorLower.includes(kw));
    if (isHaramSector) {
      return {
        status: "HARAM",
        reasons: [`Бизнес относится к харам-сектору (${input.sector})`],
      };
    }
  }

  const hasFinancials =
    input.debtToMarketCapPct !== undefined ||
    input.interestCashToMarketCapPct !== undefined ||
    input.haramRevenuePct !== undefined;

  if (!hasFinancials) {
    return {
      status: "UNSCREENED",
      reasons: [
        "Нет финансовых данных по эмитенту — укажи вручную: долг/капитализация, процентный кэш/капитализация, доля харам-выручки (в %).",
      ],
    };
  }

  const reasons: string[] = [];
  let doubtful = false;

  if (input.debtToMarketCapPct !== undefined && input.debtToMarketCapPct >= DEBT_THRESHOLD_PCT) {
    reasons.push(`Долг/капитализация ${input.debtToMarketCapPct}% ≥ ${DEBT_THRESHOLD_PCT}%`);
    doubtful = true;
  }

  if (
    input.interestCashToMarketCapPct !== undefined &&
    input.interestCashToMarketCapPct >= CASH_THRESHOLD_PCT
  ) {
    reasons.push(
      `Процентный кэш/капитализация ${input.interestCashToMarketCapPct}% ≥ ${CASH_THRESHOLD_PCT}%`
    );
    doubtful = true;
  }

  if (input.haramRevenuePct !== undefined && input.haramRevenuePct >= HARAM_REVENUE_THRESHOLD_PCT) {
    reasons.push(`Доля харам-выручки ${input.haramRevenuePct}% ≥ ${HARAM_REVENUE_THRESHOLD_PCT}%`);
    return { status: "HARAM", reasons };
  }

  if (doubtful) {
    return { status: "DOUBTFUL", reasons };
  }

  return { status: "HALAL", reasons: ["Все показатели в пределах допустимых порогов"] };
}
