import { NextResponse } from "next/server";
import { prisma } from "@finance-bot/db";
import { requireUser, AuthError } from "../../../lib/auth";

export async function GET(req: Request) {
  try {
    const user = await requireUser(req);

    const expenses = await prisma.expense.findMany({
      where: { userId: user.id },
      orderBy: { occurredAt: "desc" },
      take: 50,
    });

    return NextResponse.json(
      expenses.map((e) => ({
        id: e.id,
        amount: Number(e.amount),
        currency: e.currency,
        category: e.category,
        occurredAt: e.occurredAt.toISOString(),
      }))
    );
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    console.error(err);
    return NextResponse.json({ error: "internal error" }, { status: 500 });
  }
}
