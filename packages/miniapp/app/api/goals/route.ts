import { NextResponse } from "next/server";
import { prisma } from "@finance-bot/db";
import { requireUser, AuthError } from "../../../lib/auth";

export async function GET(req: Request) {
  try {
    const user = await requireUser(req);

    const goals = await prisma.goal.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(
      goals.map((g) => ({
        id: g.id,
        title: g.title,
        targetAmount: Number(g.targetAmount),
        currentAmount: Number(g.currentAmount),
        currency: g.currency,
        completedAt: g.completedAt ? g.completedAt.toISOString() : null,
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
