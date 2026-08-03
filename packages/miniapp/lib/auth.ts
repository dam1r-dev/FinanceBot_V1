import { prisma, type User } from "@finance-bot/db";
import { parseInitData, validateInitData } from "./telegramAuth";

export class AuthError extends Error {}

async function getUserFromInitData(initData: string): Promise<User> {
  const botToken = process.env.BOT_TOKEN;
  if (!botToken) throw new Error("BOT_TOKEN is not set");

  if (!validateInitData(initData, botToken)) {
    throw new AuthError("Invalid Telegram initData");
  }

  const parsed = parseInitData(initData);
  if (!parsed.user) {
    throw new AuthError("No user in initData");
  }

  return prisma.user.upsert({
    where: { telegramId: BigInt(parsed.user.id) },
    create: {
      telegramId: BigInt(parsed.user.id),
      username: parsed.user.username,
      firstName: parsed.user.first_name,
    },
    update: {
      username: parsed.user.username,
      firstName: parsed.user.first_name,
    },
  });
}

/** Достаёт и валидирует Telegram-пользователя из заголовка/query API-запроса. */
export async function requireUser(req: Request): Promise<User> {
  const initData =
    req.headers.get("x-telegram-init-data") ?? new URL(req.url).searchParams.get("initData");

  if (!initData) {
    throw new AuthError("Missing Telegram initData");
  }

  return getUserFromInitData(initData);
}
