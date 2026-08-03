export interface OcrReceipt {
  amount: number | null;
  merchant: string | null;
  occurredAt: Date | null;
  category: string | null;
}

export interface OcrProvider {
  readonly name: string;
  extractReceipt(imageBuffer: Buffer): Promise<OcrReceipt>;
}

/**
 * Заглушка: реальный OCR-провайдер (Google Vision / Claude vision) ещё не
 * подключён — нужен ключ в OCR_PROVIDER/OCR_API_KEY. Интерфейс готов под
 * замену, вызывающий код (handlers/expenses.ts) уже рассчитан на null-поля.
 */
class StubOcrProvider implements OcrProvider {
  readonly name = "stub";

  async extractReceipt(): Promise<OcrReceipt> {
    return { amount: null, merchant: null, occurredAt: null, category: null };
  }
}

export function getOcrProvider(): OcrProvider {
  return new StubOcrProvider();
}
