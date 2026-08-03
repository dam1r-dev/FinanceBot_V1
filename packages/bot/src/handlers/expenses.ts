import { Composer } from "grammy";
import type { BotContext } from "../bot";
import { prisma } from "@finance-bot/db";
import { getOrCreateUser, startOfWeek } from "../services/db";
import { parseExpenseText } from "../services/expenseParser";
import { getOcrProvider } from "../services/ocr";
import { convert } from "../services/fx";

export const expensesHandler = new Composer<BotContext>();

expensesHandler.command("history", async (ctx) => {
  const user = await getOrCreateUser(ctx);
  const expenses = await prisma.expense.findMany({
    where: { userId: user.id },
    orderBy: { occurredAt: "desc" },
    take: 10,
  });

  if (expenses.length === 0) {
    await ctx.reply("Пока нет трат. Просто напиши, например: «кофе 1500».");
    return;
  }

  const lines = expenses.map(
    (e) =>
      `${e.occurredAt.toLocaleDateString("ru-RU")} — ${e.category}: ${Number(e.amount).toLocaleString("ru-RU")} ${e.currency}`
  );
  await ctx.reply(["Последние траты:", ...lines].join("\n"));
});

expensesHandler.on("message:photo", async (ctx) => {
  const provider = getOcrProvider();
  const result = await provider.extractReceipt(Buffer.alloc(0));

  if (result.amount === null) {
    await ctx.reply(
      "Пока не умею распознавать чеки автоматически — введи трату текстом, например «продукты 4500»."
    );
  }
});

expensesHandler.on("message:text", async (ctx) => {
  const text = ctx.message.text;
  if (text.startsWith("/")) return; // неизвестная команда — не наша забота

  const parsed = parseExpenseText(text);
  if (!parsed) return; // не похоже на трату — молча пропускаем

  const user = await getOrCreateUser(ctx);

  await prisma.expense.create({
    data: {
      userId: user.id,
      amount: parsed.amount,
      currency: parsed.currency,
      category: parsed.category,
      source: "TEXT",
    },
  });

  await ctx.reply(
    `Записал: ${parsed.category} — ${parsed.amount.toLocaleString("ru-RU")} ${parsed.currency}`
  );

  await checkBudgetAlert(ctx, user.id, parsed.category);
});

async function checkBudgetAlert(ctx: BotContext, userId: string, category: string) {
  const budget = await prisma.budget.findUnique({
    where: { userId_category: { userId, category } },
  });
  if (!budget) return;

  const weekStart = startOfWeek();
  const expenses = await prisma.expense.findMany({
    where: { userId, category, occurredAt: { gte: weekStart } },
  });

  let totalInBudgetCurrency = 0;
  for (const e of expenses) {
    totalInBudgetCurrency += await convert(Number(e.amount), e.currency, budget.currency);
  }

  const limit = Number(budget.limitAmount);
  if (totalInBudgetCurrency > limit) {
    await ctx.reply(
      `⚠️ Превышен недельный лимит по категории «${category}»: ${totalInBudgetCurrency.toFixed(0)} / ${limit} ${budget.currency}`
    );
  }
}
