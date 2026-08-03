import { NextResponse } from "next/server";
import { prisma, convert } from "@finance-bot/db";
import { requireUser, AuthError } from "../../../lib/auth";

function startOfWeek(date = new Date()): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diffFromMonday = (day + 6) % 7;
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - diffFromMonday);
  return d;
}

export async function GET(req: Request) {
  try {
    const user = await requireUser(req);

    const weekStart = startOfWeek();
    const expenses = await prisma.expense.findMany({
      where: { userId: user.id, occurredAt: { gte: weekStart } },
      orderBy: { occurredAt: "asc" },
    });

    const byCategory = new Map<string, number>();
    const byDay = new Map<string, number>();

    for (const e of expenses) {
      const amountKzt = await convert(Number(e.amount), e.currency, "KZT");
      byCategory.set(e.category, (byCategory.get(e.category) ?? 0) + amountKzt);
      const dayKey = e.occurredAt.toLocaleDateString("ru-RU", { weekday: "short" });
      byDay.set(dayKey, (byDay.get(dayKey) ?? 0) + amountKzt);
    }

    const totalWeekKzt = [...byCategory.values()].reduce((a, b) => a + b, 0);

    return NextResponse.json({
      totalWeekKzt,
      byCategory: [...byCategory.entries()].map(([category, amountKzt]) => ({ category, amountKzt })),
      trend: [...byDay.entries()].map(([day, amountKzt]) => ({ day, amountKzt })),
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    console.error(err);
    return NextResponse.json({ error: "internal error" }, { status: 500 });
  }
}
