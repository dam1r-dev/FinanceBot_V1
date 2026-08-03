import { Composer } from "grammy";
import type { BotContext } from "../bot";
import { prisma } from "@finance-bot/db";
import { getOrCreateUser } from "../services/db";
import { convert } from "../services/fx";
import { screenInvestment, type HalalStatus } from "../services/halalScreening";

export const halalHandler = new Composer<BotContext>();

const LESSONS: { title: string; body: string }[] = [
  {
    title: "1. Риба (ссудный процент)",
    body: [
      "Риба — любое заранее обусловленное увеличение суммы долга/депозита, не связанное с реальным риском и трудом.",
      "Запрещена в исламе: и получать, и платить проценты (кредиты, депозиты, облигации с фиксированным купоном).",
      "Альтернативы: беспроцентные займы (кард аль-хасан), партнёрство с распределением прибыли и убытков (мудараба, мушарака).",
    ].join("\n"),
  },
  {
    title: "2. Гарар (чрезмерная неопределённость)",
    body: [
      "Гарар — избыточная неясность в предмете или условиях сделки, из-за которой стороны фактически не понимают, что покупают/продают.",
      "Пример: обычное страхование с фиксированным взносом при неопределённой выплате — отсюда такафул как альтернатива.",
      "Не любая неопределённость запрещена — незначительная и неизбежная (например, обычный рыночный риск акций) допустима.",
    ].join("\n"),
  },
  {
    title: "3. Закят",
    body: [
      "Закят — обязательное очищение накоплений, 2.5% в год с имущества выше нисаба (порога), которым владеешь непрерывно лунный год (хауль).",
      "Считается с: наличных, банковских остатков, инвестиций для перепродажи, драг. металлов — за вычетом текущих долгов.",
      "Посчитать свою сумму: /zakat <накопления> [KZT|USD]",
    ].join("\n"),
  },
  {
    title: "4. Халяль-скрининг инвестиций",
    body: [
      "Прежде чем инвестировать в акцию, проверяют две вещи:",
      "1) Бизнес — компания не должна получать основной доход от алкоголя, азартных игр, обычных банков/страховщиков, свинины, табака, оружия, контента для взрослых.",
      "2) Финансы — даже у «чистого» по бизнесу эмитента: долг/капитализация < 33%, процентный кэш/капитализация < 33%, доля харам-выручки < 5%.",
      "Проверить тикер: /screen <тикер> [долг%] [кэш%] [харам-выручка%] [сектор]",
    ].join("\n"),
  },
];

halalHandler.command("halal", async (ctx) => {
  const arg = ctx.match?.toString().trim();
  if (!arg) {
    const list = LESSONS.map((l) => l.title).join("\n");
    await ctx.reply(["Уроки по халяль-финансам:", list, "", "Открыть: /halal <номер>"].join("\n"));
    return;
  }
  const n = Number(arg);
  const lesson = LESSONS[n - 1];
  if (!lesson) {
    await ctx.reply(`Нет урока №${arg}. Доступно: 1-${LESSONS.length}`);
    return;
  }
  await ctx.reply(`${lesson.title}\n\n${lesson.body}`);
});

// Приблизительно, ~85г золота. Нисаб зависит от текущей цены золота —
// TODO: подключить живой источник цены золота вместо фиксированной оценки.
const NISAB_KZT_APPROX = 2_000_000;

halalHandler.command("zakat", async (ctx) => {
  const args = ctx.match?.toString().trim().split(/\s+/).filter(Boolean) ?? [];
  const amount = Number(args[0]);
  if (!Number.isFinite(amount) || amount <= 0) {
    await ctx.reply("Формат: /zakat <накопления> [KZT|USD]");
    return;
  }
  const currency = args[1]?.toUpperCase() === "USD" ? "USD" : "KZT";
  const amountKzt = await convert(amount, currency, "KZT");

  if (amountKzt < NISAB_KZT_APPROX) {
    await ctx.reply(
      [
        `Накопления (${amountKzt.toFixed(0)} KZT) ниже примерного нисаба (~${NISAB_KZT_APPROX.toLocaleString("ru-RU")} KZT) — закят не обязателен.`,
        "Нисаб зависит от текущей цены золота, значение приблизительное — сверься с актуальным курсом.",
      ].join("\n")
    );
    return;
  }

  const zakatKzt = amountKzt * 0.025;
  await ctx.reply(
    [
      `Закят: 2.5% от ${amountKzt.toFixed(0)} KZT = ${zakatKzt.toFixed(0)} KZT`,
      "",
      "Нисаб взят приблизительно (~85г золота) — уточни актуальную цену золота для точного порога.",
    ].join("\n")
  );
});

const STATUS_LABEL: Record<HalalStatus, string> = {
  HALAL: "✅ Халяль",
  HARAM: "❌ Харам",
  DOUBTFUL: "⚠️ Сомнительно (мушбух)",
  UNSCREENED: "❔ Недостаточно данных",
};

halalHandler.command("screen", async (ctx) => {
  const args = ctx.match?.toString().trim().split(/\s+/).filter(Boolean) ?? [];
  const ticker = args[0]?.toUpperCase();
  if (!ticker) {
    await ctx.reply("Формат: /screen <тикер> [долг%] [кэш%] [харам-выручка%] [сектор]");
    return;
  }

  const [debtStr, cashStr, haramStr, ...sectorParts] = args.slice(1);
  const result = screenInvestment({
    ticker,
    debtToMarketCapPct: debtStr !== undefined && !Number.isNaN(Number(debtStr)) ? Number(debtStr) : undefined,
    interestCashToMarketCapPct:
      cashStr !== undefined && !Number.isNaN(Number(cashStr)) ? Number(cashStr) : undefined,
    haramRevenuePct: haramStr !== undefined && !Number.isNaN(Number(haramStr)) ? Number(haramStr) : undefined,
    sector: sectorParts.length ? sectorParts.join(" ") : undefined,
  });

  const user = await getOrCreateUser(ctx);
  await prisma.investment.updateMany({
    where: { userId: user.id, ticker },
    data: { halalStatus: result.status, screenNotes: result.reasons.join("; "), screenedAt: new Date() },
  });

  await ctx.reply(
    [`${ticker}: ${STATUS_LABEL[result.status]}`, ...result.reasons.map((r) => `• ${r}`)].join("\n")
  );
});
