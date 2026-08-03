import { createWebhookHandler } from "@finance-bot/bot";

const handleUpdate = createWebhookHandler();

export async function POST(req: Request) {
  return handleUpdate(req);
}
