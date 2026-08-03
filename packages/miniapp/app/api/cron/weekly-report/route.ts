import { NextResponse } from "next/server";
import { getBot, runWeeklyReportsForAllUsers } from "@finance-bot/bot";

/**
 * Vercel Cron (free-план) разрешает только один запуск в сутки — сам роут
 * дополнительно проверяет, что сейчас воскресенье по Asia/Almaty, прежде
 * чем реально слать отчёты (см. vercel.json — расписание уже целится в
 * воскресенье, эта проверка — подстраховка от ручных вызовов не в тот день).
 */
export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const weekdayInAlmaty = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Almaty",
    weekday: "short",
  }).format(new Date());

  if (weekdayInAlmaty !== "Sun") {
    return NextResponse.json({ skipped: true, reason: "not Sunday in Asia/Almaty" });
  }

  const bot = getBot();
  await runWeeklyReportsForAllUsers(bot.api);

  return NextResponse.json({ ok: true });
}
