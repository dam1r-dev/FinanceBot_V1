import { Composer } from "grammy";
import type { BotContext } from "../bot";
import { prisma } from "@finance-bot/db";
import { getOrCreateUser, startOfWeek } from "../services/db";
import { convert } from "../services/fx";

export const budgetHandler = new Composer<BotContext>();

budgetHandler.command("budget", async (ctx) => {
  const user = await getOrCreateUser(ctx);
  const args = ctx.match?.toString().trim().split(/\s+/).filter(Boolean) ?? [];

  if (args.length === 0) {
    await listBudgets(ctx, user.id);
    return;
  }

  const amountIdx = args.findIndex((a) => /^\d+(\.\d+)?$/.test(a));
  if (amountIdx <= 0) {
    await ctx.reply("Формат: /budget <категория> <лимит> [KZT|USD]");
    return;
  }

  const category = args.slice(0, amountIdx).join(" ").toLowerCase();
  const limitAmount = Number(args[amountIdx]);
  const currencyArg = args[amountIdx + 1]?.toUpperCase();
  const currency = currencyArg === "USD" ? "USD" : "KZT";

  if (!category || !Number.isFinite(limitAmount) || limitAmount <= 0) {
    await ctx.reply("Формат: /budget <категория> <лимит> [KZT|USD]");
    return;
  }

  await prisma.budget.upsert({
    where: { userId_category: { userId: user.id, category } },
    create: { userId: user.id, category, limitAmount, currency },
    update: { limitAmount, currency },
  });

  await ctx.reply(`Лимит для «${category}» установлен: ${limitAmount.toLocaleString("ru-RU")} ${currency} в неделю`);
});

async function listBudgets(ctx: BotContext, userId: string) {
  const budgets = await prisma.budget.findMany({ where: { userId } });
  if (budgets.length === 0) {
    await ctx.reply("Лимиты не заданы. Формат: /budget <категория> <лимит> [KZT|USD]");
    return;
  }

  const weekStart = startOfWeek();
  const lines: string[] = [];
  for (const b of budgets) {
    const expenses = await prisma.expense.findMany({
      where: { userId, category: b.category, occurredAt: { gte: weekStart } },
    });
    let spent = 0;
    for (const e of expenses) {
      spent += await convert(Number(e.amount), e.currency, b.currency);
    }
    const limit = Number(b.limitAmount);
    const flag = spent > limit ? "⚠️" : "✅";
    lines.push(`${flag} ${b.category}: ${spent.toFixed(0)} / ${limit.toLocaleString("ru-RU")} ${b.currency}`);
  }

  await ctx.reply(["Лимиты за текущую неделю:", ...lines].join("\n"));
}
