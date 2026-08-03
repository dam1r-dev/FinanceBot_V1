import { prisma, type User } from "@finance-bot/db";
import type { Context } from "grammy";

export async function getOrCreateUser(ctx: Context): Promise<User> {
  const from = ctx.from;
  if (!from) throw new Error("No ctx.from on update");

  return prisma.user.upsert({
    where: { telegramId: BigInt(from.id) },
    create: {
      telegramId: BigInt(from.id),
      username: from.username,
      firstName: from.first_name,
    },
    update: {
      username: from.username,
      firstName: from.first_name,
    },
  });
}

/** Понедельник 00:00 текущей недели — используется как окно для лимитов бюджета. */
export function startOfWeek(date = new Date()): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0 = воскресенье
  const diffFromMonday = (day + 6) % 7;
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - diffFromMonday);
  return d;
}
