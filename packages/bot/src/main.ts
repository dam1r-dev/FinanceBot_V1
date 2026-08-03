import "dotenv/config";
import { createBot } from "./bot";
import { scheduleWeeklyReports } from "./scheduler";

const token = process.env.BOT_TOKEN;
if (!token) {
  throw new Error("BOT_TOKEN is not set");
}

const bot = createBot(token);
scheduleWeeklyReports(bot);

bot.start({
  onStart: () => console.log("Finance Bot запущен (long-polling)"),
});
