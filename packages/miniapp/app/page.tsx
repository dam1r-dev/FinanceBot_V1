"use client";

import { useEffect, useState } from "react";
import { api, type GoalDto, type InvestmentDto, type SummaryResponse, type TransactionDto } from "../lib/api";
import { CategoryPieChart } from "../components/CategoryPieChart";
import { TrendChart } from "../components/TrendChart";
import { TransactionsTable } from "../components/TransactionsTable";
import { GoalsList } from "../components/GoalsList";
import { PortfolioTable } from "../components/PortfolioTable";

export default function DashboardPage() {
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [transactions, setTransactions] = useState<TransactionDto[]>([]);
  const [goals, setGoals] = useState<GoalDto[]>([]);
  const [investments, setInvestments] = useState<InvestmentDto[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.Telegram?.WebApp?.ready();
    window.Telegram?.WebApp?.expand();

    Promise.all([api.summary(), api.transactions(), api.goals(), api.portfolio()])
      .then(([s, t, g, p]) => {
        setSummary(s);
        setTransactions(t);
        setGoals(g);
        setInvestments(p);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Не удалось загрузить данные"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-[var(--muted)]">Загрузка…</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6 text-center">
        <p className="text-sm text-[var(--muted)]">
          Не удалось загрузить данные: {error}
          <br />
          Открой дашборд через кнопку в боте — вне Telegram он не работает.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-6 flex flex-col gap-6">
      <header>
        <h1 className="text-xl font-semibold">Финансовый дашборд</h1>
        <p className="text-sm text-[var(--muted)]">
          Расходы за неделю: {summary?.totalWeekKzt.toFixed(0) ?? 0} KZT
        </p>
      </header>

      <section className="card p-4">
        <h2 className="text-sm font-medium mb-3">Расходы по категориям</h2>
        <CategoryPieChart data={summary?.byCategory ?? []} />
      </section>

      <section className="card p-4">
        <h2 className="text-sm font-medium mb-3">Тренд за неделю</h2>
        <TrendChart data={summary?.trend ?? []} />
      </section>

      <section className="card p-4">
        <h2 className="text-sm font-medium mb-3">Цели</h2>
        <GoalsList goals={goals} />
      </section>

      <section className="card p-4">
        <h2 className="text-sm font-medium mb-3">Портфель (Freedom Broker)</h2>
        <PortfolioTable investments={investments} />
      </section>

      <section className="card p-4">
        <h2 className="text-sm font-medium mb-3">Последние транзакции</h2>
        <TransactionsTable transactions={transactions} />
      </section>
    </main>
  );
}
