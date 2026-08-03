import { webhookCallback } from "grammy";
import { createBot } from "./bot";

export { createBot } from "./bot";
export type { BotContext } from "./bot";
export { sendWeeklyReport } from "./handlers/reports";
export { runWeeklyReportsForAllUsers } from "./scheduler";

let cachedBot: ReturnType<typeof createBot> | undefined;

export function getBot() {
  if (!cachedBot) {
    const token = process.env.BOT_TOKEN;
    if (!token) throw new Error("BOT_TOKEN is not set");
    cachedBot = createBot(token);
  }
  return cachedBot;
}

/** Webhook-хендлер для Next.js Route Handler (packages/miniapp). */
export function createWebhookHandler() {
  return webhookCallback(getBot(), "std/http", {
    secretToken: process.env.TELEGRAM_WEBHOOK_SECRET,
  });
}
