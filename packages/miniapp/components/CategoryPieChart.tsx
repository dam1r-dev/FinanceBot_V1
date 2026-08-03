"use client";

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

const COLORS = [
  "#2f6fed",
  "#f5a623",
  "#7ed321",
  "#d0021b",
  "#9013fe",
  "#50e3c2",
  "#b8860b",
  "#4a90e2",
  "#e67e22",
  "#16a085",
];

export interface CategoryPieChartProps {
  data: { category: string; amountKzt: number }[];
}

export function CategoryPieChart({ data }: CategoryPieChartProps) {
  if (data.length === 0) {
    return <p className="text-sm text-[var(--muted)]">Трат на этой неделе ещё не было.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={data}
          dataKey="amountKzt"
          nameKey="category"
          cx="50%"
          cy="50%"
          outerRadius={90}
          label={(entry) => `${entry.category}`}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(value: number) => `${value.toFixed(0)} KZT`} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
