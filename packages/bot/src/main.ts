import path from "node:path";
import { config as loadEnv } from "dotenv";

// .env лежит в корне монорепо, а не в packages/bot — этот файл живёт в
// src/ (dev) или dist/ (prod), в обоих случаях на одном уровне вложенности.
loadEnv({ path: path.resolve(__dirname, "../../../.env") });

// Обычный import был бы поднят компилятором выше loadEnv() (импорты всегда
// вычисляются первыми) — а "./bot" тянет за собой @finance-bot/db, которому
// уже нужен DATABASE_URL из process.env. Поэтому require() именно здесь.
const { createBot } = require("./bot") as typeof import("./bot");
const { scheduleWeeklyReports } = require("./scheduler") as typeof import("./scheduler");

const token = process.env.BOT_TOKEN;
if (!token) {
  throw new Error("BOT_TOKEN is not set");
}

const bot = createBot(token);
scheduleWeeklyReports(bot);

bot.start({
  onStart: () => console.log("Finance Bot запущен (long-polling)"),
});
