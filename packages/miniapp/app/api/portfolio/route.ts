import { NextResponse } from "next/server";
import { prisma } from "@finance-bot/db";
import { requireUser, AuthError } from "../../../lib/auth";

export async function GET(req: Request) {
  try {
    const user = await requireUser(req);

    const investments = await prisma.investment.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(
      investments.map((i) => ({
        id: i.id,
        ticker: i.ticker,
        quantity: Number(i.quantity),
        avgPrice: Number(i.avgPrice),
        currency: i.currency,
        halalStatus: i.halalStatus,
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
