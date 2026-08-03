import type { TransactionDto } from "../lib/api";

export function TransactionsTable({ transactions }: { transactions: TransactionDto[] }) {
  if (transactions.length === 0) {
    return <p className="text-sm text-[var(--muted)]">Транзакций пока нет.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-[var(--muted)]">
            <th className="py-2 pr-4 font-medium">Дата</th>
            <th className="py-2 pr-4 font-medium">Категория</th>
            <th className="py-2 font-medium text-right">Сумма</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((t) => (
            <tr key={t.id} className="border-t border-[var(--border)]">
              <td className="py-2 pr-4 whitespace-nowrap">
                {new Date(t.occurredAt).toLocaleDateString("ru-RU")}
              </td>
              <td className="py-2 pr-4 capitalize">{t.category}</td>
              <td className="py-2 text-right whitespace-nowrap">
                {t.amount.toLocaleString("ru-RU")} {t.currency}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
