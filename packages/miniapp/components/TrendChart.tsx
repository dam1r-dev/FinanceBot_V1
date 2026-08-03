"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export interface TrendChartProps {
  data: { day: string; amountKzt: number }[];
}

export function TrendChart({ data }: TrendChartProps) {
  if (data.length === 0) {
    return <p className="text-sm text-[var(--muted)]">Нет данных для тренда.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey="day" stroke="var(--muted)" fontSize={12} />
        <YAxis stroke="var(--muted)" fontSize={12} />
        <Tooltip formatter={(value: number) => `${value.toFixed(0)} KZT`} />
        <Area type="monotone" dataKey="amountKzt" stroke="#2f6fed" fill="#2f6fed33" strokeWidth={2} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
