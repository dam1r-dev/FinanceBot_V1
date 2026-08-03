import { Bot, Context } from "grammy";
import { startHandler } from "./handlers/start";
import { expensesHandler } from "./handlers/expenses";
import { budgetHandler } from "./handlers/budget";
import { goalsHandler } from "./handlers/goals";
import { halalHandler } from "./handlers/halal";
import { reportsHandler } from "./handlers/reports";

export type BotContext = Context;

export function createBot(token: string): Bot<BotContext> {
  const bot = new Bot<BotContext>(token);

  bot.use(startHandler);
  bot.use(budgetHandler);
  bot.use(goalsHandler);
  bot.use(halalHandler);
  bot.use(reportsHandler);
  // Должен идти последним: перехватывает произвольный текст как ввод траты.
  bot.use(expensesHandler);

  bot.catch((err) => {
    console.error("Bot error:", err.error);
  });

  return bot;
}
