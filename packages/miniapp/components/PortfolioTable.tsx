import type { InvestmentDto } from "../lib/api";

const STATUS_LABEL: Record<string, string> = {
  HALAL: "✅ Халяль",
  HARAM: "❌ Харам",
  DOUBTFUL: "⚠️ Сомнительно",
  UNSCREENED: "❔ Не проверено",
};

export function PortfolioTable({ investments }: { investments: InvestmentDto[] }) {
  if (investments.length === 0) {
    return <p className="text-sm text-[var(--muted)]">Позиций в портфеле пока нет.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-[var(--muted)]">
            <th className="py-2 pr-4 font-medium">Тикер</th>
            <th className="py-2 pr-4 font-medium text-right">Кол-во</th>
            <th className="py-2 pr-4 font-medium text-right">Ср. цена</th>
            <th className="py-2 font-medium">Халяль-статус</th>
          </tr>
        </thead>
        <tbody>
          {investments.map((i) => (
            <tr key={i.id} className="border-t border-[var(--border)]">
              <td className="py-2 pr-4 font-medium">{i.ticker}</td>
              <td className="py-2 pr-4 text-right">{i.quantity}</td>
              <td className="py-2 pr-4 text-right">
                {i.avgPrice.toLocaleString("ru-RU")} {i.currency}
              </td>
              <td className="py-2">{STATUS_LABEL[i.halalStatus] ?? i.halalStatus}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
