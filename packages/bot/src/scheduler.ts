import cron from "node-cron";
import { prisma } from "@finance-bot/db";
import type { Bot } from "grammy";
import type { BotContext } from "./bot";
import { sendWeeklyReport } from "./handlers/reports";

export async function runWeeklyReportsForAllUsers(api: Bot<BotContext>["api"]) {
  const users = await prisma.user.findMany();
  for (const user of users) {
    try {
      await sendWeeklyReport(api, user.id, Number(user.telegramId), "WEEKLY");
    } catch (err) {
      console.error(`Еженедельный отчёт не отправлен для пользователя ${user.id}:`, err);
    }
  }
}

/**
 * Планировщик для standalone long-polling режима (свой сервер/VPS).
 * На Vercel эквивалент — /api/cron/weekly-report, дёргаемый Vercel Cron.
 */
export function scheduleWeeklyReports(bot: Bot<BotContext>) {
  cron.schedule(
    "0 20 * * 0", // воскресенье, 20:00
    () => {
      runWeeklyReportsForAllUsers(bot.api).catch((err) =>
        console.error("Ошибка планировщика еженедельных отчётов:", err)
      );
    },
    { timezone: "Asia/Almaty" }
  );
}
