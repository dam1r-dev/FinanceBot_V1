import { Composer, type Api } from "grammy";
import type { BotContext } from "../bot";
import { prisma } from "@finance-bot/db";
import { getOrCreateUser, startOfWeek } from "../services/db";
import { convert } from "../services/fx";
import { buildPieChartUrl, buildTrendChartUrl } from "../services/chart";

export const reportsHandler = new Composer<BotContext>();

reportsHandler.command("report", async (ctx) => {
  if (!ctx.chat) return;
  const user = await getOrCreateUser(ctx);
  await sendWeeklyReport(ctx.api, user.id, ctx.chat.id, "ON_DEMAND");
});

export async function sendWeeklyReport(
  api: Api,
  userId: string,
  chatId: number,
  type: "WEEKLY" | "ON_DEMAND" = "WEEKLY"
) {
  const weekStart = startOfWeek();
  const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);

  const expenses = await prisma.expense.findMany({
    where: { userId, occurredAt: { gte: weekStart, lt: weekEnd } },
  });

  if (expenses.length === 0) {
    await api.sendMessage(chatId, "На этой неделе трат ещё не было.");
    return;
  }

  const byCategory = new Map<string, number>();
  const byDay = new Map<string, number>();

  for (const e of expenses) {
    const amountKzt = await convert(Number(e.amount), e.currency, "KZT");
    byCategory.set(e.category, (byCategory.get(e.category) ?? 0) + amountKzt);
    const dayKey = e.occurredAt.toLocaleDateString("ru-RU", { weekday: "short" });
    byDay.set(dayKey, (byDay.get(dayKey) ?? 0) + amountKzt);
  }

  const total = [...byCategory.values()].reduce((a, b) => a + b, 0);

  const pieUrl = buildPieChartUrl(
    [...byCategory.keys()],
    [...byCategory.values()],
    "Расходы по категориям, KZT"
  );
  const trendUrl = buildTrendChartUrl([...byDay.keys()], [...byDay.values()], "Тренд по дням, KZT");

  await api.sendPhoto(chatId, pieUrl, {
    caption: `Расходы за неделю: ${total.toFixed(0)} KZT`,
  });
  await api.sendPhoto(chatId, trendUrl);

  await prisma.reportLog.create({
    data: { userId, type, periodStart: weekStart, periodEnd: weekEnd },
  });
}
