import { Composer } from "grammy";
import type { BotContext } from "../bot";
import { getOrCreateUser } from "../services/db";

export const startHandler = new Composer<BotContext>();

startHandler.command("start", async (ctx) => {
  await getOrCreateUser(ctx);

  const miniAppUrl = process.env.MINI_APP_URL;

  await ctx.reply(
    [
      "Привет! Я твой личный финансовый бот.",
      "",
      "Как пользоваться:",
      "• Просто напиши трату текстом: «кофе 1500» или «20 usd такси»",
      "• /budget — лимиты по категориям",
      "• /goal, /goals — накопительные цели",
      "• /halal, /zakat, /screen — халяль-финансы",
      "• /report — графики за неделю",
      "",
      "Полный список команд: /help",
    ].join("\n"),
    miniAppUrl
      ? {
          reply_markup: {
            inline_keyboard: [[{ text: "📊 Открыть дашборд", web_app: { url: miniAppUrl } }]],
          },
        }
      : undefined
  );
});

startHandler.command("help", async (ctx) => {
  await ctx.reply(
    [
      "Команды:",
      "/budget [категория] [лимит] [KZT|USD] — задать лимит или посмотреть текущие",
      "/history — последние 10 трат",
      "/goal <название> <сумма> [KZT|USD] — создать цель",
      "/goal add <название> <сумма> — пополнить цель",
      "/goals — список целей и прогресс",
      "/halal [номер] — уроки по халяль-финансам",
      "/zakat <сумма> [KZT|USD] — калькулятор закята",
      "/screen <тикер> [долг%] [кэш%] [харам-выручка%] [сектор] — скрининг тикера",
      "/report — отчёт с графиками за неделю",
    ].join("\n")
  );
});
