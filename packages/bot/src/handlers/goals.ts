import { Composer } from "grammy";
import type { BotContext } from "../bot";
import { prisma } from "@finance-bot/db";
import { getOrCreateUser } from "../services/db";

export const goalsHandler = new Composer<BotContext>();

goalsHandler.command("goal", async (ctx) => {
  const user = await getOrCreateUser(ctx);
  const raw = ctx.match?.toString().trim() ?? "";
  const parts = raw.split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    await ctx.reply(
      "Формат: /goal <название> <сумма> — создать цель\n/goal add <название> <сумма> — пополнить"
    );
    return;
  }

  if (parts[0].toLowerCase() === "add") {
    await addToGoal(ctx, user.id, parts.slice(1));
    return;
  }

  await createGoal(ctx, user.id, parts);
});

async function createGoal(ctx: BotContext, userId: string, parts: string[]) {
  const amountIdx = parts.findIndex((p) => /^\d+(\.\d+)?$/.test(p));
  if (amountIdx <= 0) {
    await ctx.reply("Формат: /goal <название> <сумма> [KZT|USD]");
    return;
  }
  const title = parts.slice(0, amountIdx).join(" ");
  const targetAmount = Number(parts[amountIdx]);
  const currencyArg = parts[amountIdx + 1]?.toUpperCase();
  const currency = currencyArg === "USD" ? "USD" : "KZT";

  await prisma.goal.create({
    data: { userId, title, targetAmount, currency },
  });

  await ctx.reply(`Цель «${title}» создана: ${targetAmount.toLocaleString("ru-RU")} ${currency}`);
}

async function addToGoal(ctx: BotContext, userId: string, parts: string[]) {
  const amountIdx = parts.findIndex((p) => /^\d+(\.\d+)?$/.test(p));
  if (amountIdx <= 0) {
    await ctx.reply("Формат: /goal add <название> <сумма>");
    return;
  }
  const title = parts.slice(0, amountIdx).join(" ");
  const amount = Number(parts[amountIdx]);

  const goal = await prisma.goal.findFirst({
    where: { userId, title: { equals: title, mode: "insensitive" } },
  });
  if (!goal) {
    await ctx.reply(`Цель «${title}» не найдена. Сначала создай: /goal ${title} <сумма>`);
    return;
  }

  const newAmount = Number(goal.currentAmount) + amount;
  const target = Number(goal.targetAmount);
  const completed = newAmount >= target;

  await prisma.goal.update({
    where: { id: goal.id },
    data: { currentAmount: newAmount, completedAt: completed ? new Date() : null },
  });

  const pct = Math.min(100, Math.round((newAmount / target) * 100));
  await ctx.reply(
    `«${goal.title}»: ${newAmount.toLocaleString("ru-RU")} / ${target.toLocaleString("ru-RU")} ${goal.currency} (${pct}%)${
      completed ? " 🎉 Цель достигнута!" : ""
    }`
  );
}

goalsHandler.command("goals", async (ctx) => {
  const user = await getOrCreateUser(ctx);
  const goals = await prisma.goal.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
  });

  if (goals.length === 0) {
    await ctx.reply("Целей пока нет. Создай: /goal <название> <сумма>");
    return;
  }

  const lines = goals.map((g) => {
    const current = Number(g.currentAmount);
    const target = Number(g.targetAmount);
    const pct = Math.min(100, Math.round((current / target) * 100));
    const barLen = 10;
    const filled = Math.round((pct / 100) * barLen);
    const bar = "█".repeat(filled) + "░".repeat(barLen - filled);
    const done = g.completedAt ? " 🎉" : "";
    return `${g.title}${done}\n${bar} ${pct}% (${current.toLocaleString("ru-RU")} / ${target.toLocaleString("ru-RU")} ${g.currency})`;
  });

  await ctx.reply(lines.join("\n\n"));
});
