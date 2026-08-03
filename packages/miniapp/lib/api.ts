"use client";

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        initData: string;
        ready: () => void;
        expand: () => void;
        colorScheme: "light" | "dark";
      };
    };
  }
}

function getInitData(): string {
  if (typeof window === "undefined") return "";
  return window.Telegram?.WebApp?.initData ?? "";
}

async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(path, {
    headers: { "x-telegram-init-data": getInitData() },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`API error ${res.status}: ${await res.text()}`);
  }
  return res.json() as Promise<T>;
}

export interface SummaryResponse {
  totalWeekKzt: number;
  byCategory: { category: string; amountKzt: number }[];
  trend: { day: string; amountKzt: number }[];
}

export interface TransactionDto {
  id: string;
  amount: number;
  currency: string;
  category: string;
  occurredAt: string;
}

export interface GoalDto {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  currency: string;
  completedAt: string | null;
}

export interface InvestmentDto {
  id: string;
  ticker: string;
  quantity: number;
  avgPrice: number;
  currency: string;
  halalStatus: string;
}

export const api = {
  summary: () => apiFetch<SummaryResponse>("/api/summary"),
  transactions: () => apiFetch<TransactionDto[]>("/api/transactions"),
  goals: () => apiFetch<GoalDto[]>("/api/goals"),
  portfolio: () => apiFetch<InvestmentDto[]>("/api/portfolio"),
};
