import type { GoalDto } from "../lib/api";

export function GoalsList({ goals }: { goals: GoalDto[] }) {
  if (goals.length === 0) {
    return <p className="text-sm text-[var(--muted)]">Целей пока нет. Создай в чате: /goal название сумма.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      {goals.map((g) => {
        const pct = Math.min(100, Math.round((g.currentAmount / g.targetAmount) * 100));
        return (
          <div key={g.id}>
            <div className="flex justify-between text-sm mb-1">
              <span className="font-medium">
                {g.title}
                {g.completedAt ? " 🎉" : ""}
              </span>
              <span className="text-[var(--muted)]">
                {g.currentAmount.toLocaleString("ru-RU")} / {g.targetAmount.toLocaleString("ru-RU")}{" "}
                {g.currency}
              </span>
            </div>
            <div className="h-2 rounded-full bg-[var(--border)] overflow-hidden">
              <div
                className="h-full rounded-full bg-[#2f6fed]"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
